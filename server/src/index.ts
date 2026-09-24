import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, initializeDatabase } from "./db.js";

dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "fundsflow-api" });
});

app.get("/api/transactions", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, description, amount::float AS amount, kind, category,
              TO_CHAR(transaction_date, 'YYYY-MM-DD') AS date
       FROM transactions ORDER BY transaction_date DESC, id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load transactions." });
  }
});

app.post("/api/transactions", async (req, res) => {
  const { description, amount, kind, category, date } = req.body ?? {};
  const numericAmount = Number(amount);

  if (typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "Description is required." });
  }
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number." });
  }
  if (kind !== "income" && kind !== "expense") {
    return res.status(400).json({ error: "Kind must be income or expense." });
  }
  if (typeof category !== "string" || !category.trim()) {
    return res.status(400).json({ error: "Category is required." });
  }
  const transactionDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : new Date().toISOString().slice(0, 10);

  try {
    const result = await pool.query(
      `INSERT INTO transactions (description, amount, kind, category, transaction_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, description, amount::float AS amount, kind, category,
                 TO_CHAR(transaction_date, 'YYYY-MM-DD') AS date`,
      [description.trim(), numericAmount, kind, category.trim(), transactionDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save transaction." });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid transaction ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transaction not found." });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete transaction." });
  }
});

app.get("/api/summary", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE kind = 'income'), 0)::float AS income,
        COALESCE(SUM(amount) FILTER (WHERE kind = 'expense'), 0)::float AS expenses
      FROM transactions
    `);
    const income = result.rows[0].income as number;
    const expenses = result.rows[0].expenses as number;
    res.json({ income, expenses, balance: income - expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not calculate summary." });
  }
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(port, () => console.log(`FundsFlow API listening on http://localhost:${port}`));
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

void start();
