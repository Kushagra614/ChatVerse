import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost/chatverse',
});

export const run = async (sql, params = []) => {
  return pool.query(sql, params);
};

export const get = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows[0];
};

export const all = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

export const initDb = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room VARCHAR(100) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Database initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
  }
};

export const closeDb = async () => {
  await pool.end();
};
