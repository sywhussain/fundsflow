# FundsFlow

A single-user, local-first personal finance tracker built with **React + TypeScript**, **Node.js + Express**, and **PostgreSQL**.

## Features
- **Transaction management:** Create, edit (`PATCH`), and delete income or expense entries with inline delete confirmation.
- **Search & filtering:** Filter activity in real time by transaction type (`income` / `expense`), category, or search query.
- **Accurate summary totals:** Computes total income, total expenses, and net balance in PostgreSQL using integer paise (`NUMERIC(12, 2)`) to avoid floating-point rounding drift.
- **API validation & error handling:** Validates calendar dates (`YYYY-MM-DD`), decimal precision (up to 2 places), string lengths, and numeric bounds, returning structured JSON errors (`400` / `404` / `503`).
- **Safe database seeding:** `npm run seed` populates sample transactions only when the table is empty; `npm run seed:reset` explicitly resets and re-seeds.

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite 6, Lucide Icons, CSS Grid/Flexbox
- **Backend:** Node.js, Express 4, TypeScript (`tsx`)
- **Database:** PostgreSQL 16 (`pg` driver, Docker Compose)

## Project Structure
```text
fundsflow/
├── client/
│   ├── .env.example
│   └── src/
│       ├── api.ts
│       ├── types.ts
│       ├── utils/format.ts
│       ├── components/
│       │   ├── SummaryCards.tsx
│       │   ├── TransactionForm.tsx
│       │   └── TransactionList.tsx
│       ├── App.tsx
│       └── styles.css
├── server/
│   ├── .env.example
│   └── src/
│       ├── db.ts
│       ├── index.ts
│       └── seed.ts
└── docker-compose.yml