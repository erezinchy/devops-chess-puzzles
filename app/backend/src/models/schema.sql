CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rating INTEGER DEFAULT 1200,
    puzzles_solved INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS puzzles (
    id SERIAL PRIMARY KEY,
    fen VARCHAR(255) NOT NULL,
    moves TEXT NOT NULL,
    rating INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    themes TEXT,
    daily_date DATE,
    source VARCHAR(50) DEFAULT 'lichess',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE CASCADE,
    solved BOOLEAN NOT NULL,
    time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_puzzles_difficulty ON puzzles(difficulty);
CREATE INDEX idx_puzzles_daily_date ON puzzles(daily_date);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_users_rating ON users(rating DESC);
