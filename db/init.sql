CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    photo_url TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_title VARCHAR(200) NOT NULL,
    book_author VARCHAR(100) NOT NULL,
    publish_year INTEGER NOT NULL,
    book_genre VARCHAR(50),
    review_text TEXT NOT NULL,
    image_url TEXT NOT NULL
);
