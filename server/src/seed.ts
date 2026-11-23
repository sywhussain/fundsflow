import { pool, initializeDatabase } from "./db.js";

function daysAgoIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const SAMPLE_TRANSACTIONS = [
  {
    description: "Monthly salary",
    amount: 85000,
    kind: "income",
    category: "Salary",
    date: daysAgoIsoDate(14)
  },
  {
    description: "Apartment rent",
    amount: 24000,
    kind: "expense",
    category: "Housing",
    date: daysAgoIsoDate(12)
  },
  {
    description: "Freelance UI review",
    amount: 12500,
    kind: "income",
    category: "Salary",
    date: daysAgoIsoDate(9)
  },
  {
    description: "Grocery & fresh produce",
    amount: 3450.5,
    kind: "expense",
    category: "Food",
    date: daysAgoIsoDate(7)
  },
  {
    description: "Electricity & broadband bill",
    amount: 2180,
    kind: "expense",
    category: "Bills",
    date: daysAgoIsoDate(5)
  },
  {
    description: "Metro card recharge",
    amount: 800,
    kind: "expense",
    category: "Transport",
    date: daysAgoIsoDate(3)
  },
  {
    description: "Pharmacy & health checkup",
    amount: 1650,
    kind: "expense",
    category: "Health",
    date: daysAgoIsoDate(1)
  },
  {
    description: "Coffee & lunch",
    amount: 540,
    kind: "expense",
    category: "Food",
    date: daysAgoIsoDate(0)
  }
];

async function runSeed() {
  const isReset = process.argv.includes("--reset");

  try {
    await initializeDatabase();

    if (isReset) {
      await pool.query("TRUNCATE TABLE transactions RESTART IDENTITY");
      console.log("Cleared existing transactions (--reset).");
    } else {
      const countResult = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM transactions"
      );
      const existingCount = countResult.rows[0].count;
      if (existingCount > 0) {
        console.log(
          `Database already contains ${existingCount} transaction(s). Skipping seed to preserve existing data.`
        );
        console.log("Run 'npm run seed:reset' if you explicitly want to wipe and re-seed.");
        return;
      }
    }

    for (const tx of SAMPLE_TRANSACTIONS) {
      await pool.query(
        `INSERT INTO transactions (description, amount, kind, category, transaction_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [tx.description, tx.amount, tx.kind, tx.category, tx.date]
      );
    }

    console.log(`Seeded ${SAMPLE_TRANSACTIONS.length} sample transactions.`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void runSeed();