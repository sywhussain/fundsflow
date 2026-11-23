import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, initializeDatabase } from "./db.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const MAX_DESCRIPTION_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 50;
const MAX_AMOUNT = 9_999_999_999.99;

type TransactionKind = "income" | "expense";

interface ValidatedTransactionInput {
  description: string;
  amount: number;
  kind: TransactionKind;
  category: string;
  date: string;
}

interface TransactionRow {
  id: number;
  description: string;
  amount: string;
  kind: TransactionKind;
  category: string;
  date: string;
}

function getLocalIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function validateTransactionPayload(
  body: unknown
): { data: ValidatedTransactionInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be a JSON object." };
  }

  const { description, amount, kind, category, date } = body as Record<string, unknown>;

  if (typeof description !== "string" || !description.trim()) {
    return { error: "Description is required." };
  }
  const trimmedDescription = description.trim();
  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` };
  }

  const numericAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  if (numericAmount > MAX_AMOUNT) {
    return { error: `Amount must not exceed ${MAX_AMOUNT.toLocaleString("en-US")}.` };
  }
  if (Math.abs(numericAmount * 100 - Math.round(numericAmount * 100)) > 1e-6) {
    return { error: "Amount can have at most 2 decimal places." };
  }

  if (kind !== "income" && kind !== "expense") {
    return { error: "Kind must be 'income' or 'expense'." };
  }

  if (typeof category !== "string" || !category.trim()) {
    return { error: "Category is required." };
  }
  const trimmedCategory = category.trim();
  if (trimmedCategory.length > MAX_CATEGORY_LENGTH) {
    return { error: `Category must be ${MAX_CATEGORY_LENGTH} characters or fewer.` };
  }

  let transactionDate: string;
  if (date === undefined || date === null || date === "") {
    transactionDate = getLocalIsoDate();
  } else if (typeof date === "string" && isValidIsoDate(date)) {
    transactionDate = date;
  } else {
    return { error: "Date must be a valid calendar date in YYYY-MM-DD format." };
  }

  return {
    data: {
      description: trimmedDescription,
      amount: Math.round(numericAmount * 100) / 100,
      kind,
      category: trimmedCategory,
      date: transactionDate
    }
  };
}

function serializeTransaction(row: TransactionRow) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    kind: row.kind,
    category: row.category,
    date: row.date
  };
}

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "fundsflow-api", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "error", service: "fundsflow-api", database: "disconnected" });
  }
});

app.get("/api/transactions", async (_req, res) => {
  try {
    const result = await pool.query<TransactionRow>(
      `SELECT id, description, amount::text AS amount, kind, category,
              TO_CHAR(transaction_date, 'YYYY-MM-DD') AS date
       FROM transactions
       ORDER BY transaction_date DESC, id DESC`
    );
    res.json(result.rows.map(serializeTransaction));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load transactions." });
  }
});

app.post("/api/transactions", async (req, res) => {
  const validation = validateTransactionPayload(req.body);
  if ("error" in validation) {
    return res.status(400).json({ error: validation.error });
  }

  const { description, amount, kind, category, date } = validation.data;

  try {
    const result = await pool.query<TransactionRow>(
      `INSERT INTO transactions (description, amount, kind, category, transaction_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, description, amount::text AS amount, kind, category,
                 TO_CHAR(transaction_date, 'YYYY-MM-DD') AS date`,
      [description, amount, kind, category, date]
    );
    res.status(201).json(serializeTransaction(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save transaction." });
  }
});

app.patch("/api/transactions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid transaction ID." });
  }

  const validation = validateTransactionPayload(req.body);
  if ("error" in validation) {
    return res.status(400).json({ error: validation.error });
  }

  const { description, amount, kind, category, date } = validation.data;

  try {
    const result = await pool.query<TransactionRow>(
      `UPDATE transactions
       SET description = $1,
           amount = $2,
           kind = $3,
           category = $4,
           transaction_date = $5
       WHERE id = $6
       RETURNING id, description, amount::text AS amount, kind, category,
                 TO_CHAR(transaction_date, 'YYYY-MM-DD') AS date`,
      [description, amount, kind, category, date, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transaction not found." });
    }
    res.json(serializeTransaction(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update transaction." });
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
    const result = await pool.query<{
      income_paise: string;
      expenses_paise: string;
    }>(`
      SELECT
        COALESCE(ROUND(SUM(amount) FILTER (WHERE kind = 'income') * 100), 0)::bigint AS income_paise,
        COALESCE(ROUND(SUM(amount) FILTER (WHERE kind = 'expense') * 100), 0)::bigint AS expenses_paise
      FROM transactions
    `);
    const incomePaise = Number(result.rows[0].income_paise);
    const expensesPaise = Number(result.rows[0].expenses_paise);
    const balancePaise = incomePaise - expensesPaise;

    res.json({
      income: incomePaise / 100,
      expenses: expensesPaise / 100,
      balance: balancePaise / 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not calculate summary." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  try {
    await initializeDatabase();
    const server = app.listen(port, () => {
      console.log(`FundsFlow API listening on http://localhost:${port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

void start();