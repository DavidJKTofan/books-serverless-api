DROP TABLE IF EXISTS books;
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER,
    isbn TEXT,
    genre TEXT,
    description TEXT
);

INSERT INTO books (title, author, year, isbn, genre, description) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 1925, '978-0743273565', 'Literary Fiction', 'A tale of the Jazz Age, focusing on mysterious millionaire Jay Gatsby and his obsession with Daisy Buchanan.'),
('1984', 'George Orwell', 1949, '978-0451524935', 'Dystopian Fiction', 'A dystopian novel set in a totalitarian society, following Winston Smith''s rebellion against Big Brother.'),
('Pride and Prejudice', 'Jane Austen', 1813, '978-0141439518', 'Romance', 'The story of Elizabeth Bennet and her prejudice against the proud Mr. Darcy in Regency-era England.'),
('The Hobbit', 'J.R.R. Tolkien', 1937, '978-0547928227', 'Fantasy', 'Bilbo Baggins'' unexpected journey with thirteen dwarves to reclaim their mountain home from a dragon.'),
('Dune', 'Frank Herbert', 1965, '978-0441172719', 'Science Fiction', 'A complex tale of politics, religion, and ecology on the desert planet Arrakis.'),
('To Kill a Mockingbird', 'Harper Lee', 1960, '978-0446310789', 'Literary Fiction', 'A story of racial injustice and loss of innocence in the American South, told through the eyes of Scout Finch.');
