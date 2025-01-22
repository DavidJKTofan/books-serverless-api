# Books Serverless API

A simple serverless REST API built with [Cloudflare Workers](https://workers.cloudflare.com/) and [D1 database](https://developers.cloudflare.com/d1/) for managing a book collection.

## Setup

Create Cloudflare Workers project:

```bash
npm create cloudflare@latest -- books-serverless-api
```

Note we are using the new `json` [wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/).

Create D1 database:

```bash
npx wrangler d1 create prod-d1-books-serverless-api
```

Apply the D1 database schema with first examples:

```bash
npx wrangler d1 execute prod-d1-books-serverless-api --file=database_schema_01.sql --remote
```

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns the API's operational status and timestamp.

### Statistics

```http
GET /api/stats
```

Returns overall statistics including total books, genre breakdown, and publication year range.

### Books Collection

#### List Books

```http
GET /api/books
```

Query Parameters:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `genre` (optional): Filter by genre
- `year` (optional): Filter by publication year

#### Create Book

```http
POST /api/books
```

Required fields:

```json
{
	"title": "string",
	"author": "string",
	"year": "number (optional)",
	"isbn": "string (optional)",
	"genre": "string (optional)",
	"description": "string (optional)"
}
```

### Single Book Operations

#### Get Book

```http
GET /api/books/:id
```

#### Update Book

```http
PUT /api/books/:id
```

Same fields as create book endpoint.

#### Delete Book

```http
DELETE /api/books/:id
```

### Search

```http
GET /api/books/search?q=query
```

Searches across title, author, genre, ISBN, year, and description fields.

## Example Requests

### List Books with Pagination

```bash
curl "https://api.dlsdemo.com/api/books?page=1&limit=5"
```

### Search Books

```bash
curl "https://api.dlsdemo.com/api/books/search?q=fiction"
```

### Create New Book

```bash
curl -X POST "https://api.dlsdemo.com/api/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Neuromancer",
    "author": "William Gibson",
    "year": 1984,
    "genre": "Science Fiction",
    "isbn": "9780441569595",
    "description": "A groundbreaking cyberpunk novel about a washed-up computer hacker hired for one last job."
  }'
```

### Update Book

```bash
curl -X PUT "https://api.dlsdemo.com/api/books/1" \
  -H "Content-Type: application/json" \
  -d '{
    "genre": "Classic Literature"
  }'
```

## Database Schema

```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER,
    isbn TEXT,
    genre TEXT,
    description TEXT
);
```

## Development

Local development:

```bash
npm run dev
```

Deploy to Cloudflare:

```bash
npm run deploy
```

## Features

- Full CRUD operations for books
- Pagination and filtering
- Full-text search
- Input validation
- Error handling
- CORS support
- Health checking
- Statistics endpoint

## Disclaimer

This is a demonstration project showcasing Cloudflare Workers and D1 database capabilities. While it implements proper security measures and best practices, additional security considerations should be implemented for production use.

Educational purposes only.
