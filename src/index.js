const ROUTES = {
	SEARCH: new URLPattern({ pathname: '/api/books/search' }), // Move SEARCH before SINGLE_BOOK
	BOOKS_COLLECTION: new URLPattern({ pathname: '/api/books' }),
	SINGLE_BOOK: new URLPattern({ pathname: '/api/books/:id([0-9]+)' }), // Add numeric constraint
	STATS: new URLPattern({ pathname: '/api/stats' }),
	HEALTH: new URLPattern({ pathname: '/api/health' })
  };

// Input validation helper
const validateBook = (book) => {
	const required = ['title', 'author'];
	const missing = required.filter((field) => !book[field]);
	if (missing.length) {
		throw new Error(`Missing required fields: ${missing.join(', ')}`);
	}

	if (book.year && (isNaN(book.year) || book.year < 0)) {
		throw new Error('Year must be a valid number');
	}

	if (book.isbn && !/^(?:\d{10}|\d{13}|[\d-]{13,17})$/.test(book.isbn)) {
		throw new Error('Invalid ISBN format');
	}
};

// Safe number parsing helper
const safeParseInt = (value, defaultValue) => {
	const parsed = parseInt(value);
	return !isNaN(parsed) && parsed > 0 ? parsed : defaultValue;
};

// Response helper
const createResponse = (body, status = 200, headers = {}) => {
	return new Response(JSON.stringify(body, null, 2), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			...headers,
		},
	});
};

export default {
	async fetch(request, env, ctx) {
		if (request.method === 'OPTIONS') {
			return createResponse(null, 204);
		}

		const url = new URL(request.url);
		const params = url.searchParams;

		try {
			// Search endpoint - Check this first
			if (ROUTES.SEARCH.test(url)) {
				const query = params.get('q');
				if (!query) {
					return createResponse({ error: 'Search query is required' }, 400);
				}

				const searchTerm = `%${query}%`;
				const { results } = await env.DB.prepare(
					`
				  SELECT * FROM books 
				  WHERE title LIKE ? 
				  OR author LIKE ? 
				  OR genre LIKE ? 
				  OR isbn LIKE ? 
				  OR year LIKE ? 
				  OR description LIKE ?
				  ORDER BY id ASC
				`
				)
					.bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
					.all();

				return createResponse({
					query,
					results,
					count: results.length,
				});
			}

			// Books collection endpoint
			if (ROUTES.BOOKS_COLLECTION.test(url)) {
				switch (request.method) {
					case 'GET': {
						const page = safeParseInt(params.get('page'), 1);
						const limit = Math.min(safeParseInt(params.get('limit'), 10), 100);
						const offset = (page - 1) * limit;
						const genre = params.get('genre');
						const year = safeParseInt(params.get('year'), null);

						let query = 'SELECT * FROM books WHERE 1=1';
						const bindings = [];

						if (genre) {
							query += ' AND genre = ?';
							bindings.push(genre);
						}

						if (year) {
							query += ' AND year = ?';
							bindings.push(year);
						}

						const countQuery = query.replace('*', 'COUNT(*) as count');
						const {
							results: [{ count }],
						} = await env.DB.prepare(countQuery)
							.bind(...bindings)
							.all();

						query += ' ORDER BY id ASC LIMIT ? OFFSET ?';
						bindings.push(limit, offset);

						const { results } = await env.DB.prepare(query)
							.bind(...bindings)
							.all();

						return createResponse({
							data: results,
							pagination: {
								total: count,
								page,
								limit,
								pages: Math.ceil(count / limit),
							},
						});
					}

					case 'POST': {
						const book = await request.json();
						validateBook(book);

						const stmt = await env.DB.prepare(
							`
				INSERT INTO books (title, author, year, isbn, genre, description)
				VALUES (?, ?, ?, ?, ?, ?)
			  `
						).bind(book.title, book.author, book.year || null, book.isbn || null, book.genre || null, book.description || null);

						const result = await stmt.run();
						const {
							results: [inserted],
						} = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(result.lastRowId).all();

						return createResponse(inserted, 201);
					}
				}
			}

			// Single book endpoint
			else if (ROUTES.SINGLE_BOOK.test(url)) {
				const match = ROUTES.SINGLE_BOOK.exec(url);
				const id = safeParseInt(match.pathname.groups.id, 0);

				if (id === 0) {
					return createResponse({ error: 'Invalid book ID' }, 400);
				}

				const {
					results: [book],
				} = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(id).all();

				if (!book) {
					return createResponse({ error: 'Book not found' }, 404);
				}

				switch (request.method) {
					case 'GET':
						return createResponse(book);

					case 'PUT': {
						const updates = await request.json();
						validateBook({ ...book, ...updates });

						const setClause = Object.keys(updates)
							.map((key) => `${key} = ?`)
							.join(', ');
						const values = [...Object.values(updates), id];

						await env.DB.prepare(`UPDATE books SET ${setClause} WHERE id = ?`)
							.bind(...values)
							.run();

						const {
							results: [updated],
						} = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(id).all();

						return createResponse(updated);
					}

					case 'DELETE':
						await env.DB.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
						return createResponse(null, 204);
				}
			}

			// Stats endpoint
			else if (ROUTES.STATS.test(url)) {
				const stats = await Promise.all([
					env.DB.prepare('SELECT COUNT(*) as total FROM books').first(),
					env.DB.prepare('SELECT genre, COUNT(*) as count FROM books GROUP BY genre').all(),
					env.DB.prepare('SELECT MIN(year) as earliest, MAX(year) as latest FROM books').first(),
				]);

				return createResponse({
					totalBooks: stats[0].total,
					genreBreakdown: stats[1].results,
					yearRange: {
						earliest: stats[2].earliest,
						latest: stats[2].latest,
					},
				});
			}

			// Health check endpoint
			else if (ROUTES.HEALTH.test(url)) {
				await env.DB.prepare('SELECT 1').first();
				return createResponse({
					status: 'healthy',
					timestamp: new Date().toISOString(),
				});
			}

			return createResponse({ error: 'Not Found' }, 404);
		} catch (error) {
			console.error(error);
			const status = error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500;

			return createResponse(
				{
					error: error.message || 'Internal Server Error',
				},
				status
			);
		}
	},
};
