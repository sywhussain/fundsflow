import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Copy server/.env.example to server/.env and set DATABASE_URL."
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
      category TEXT NOT NULL,
      transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}