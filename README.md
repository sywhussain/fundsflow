# FundsFlow

A learning-focused full-stack personal finance tracker built with React + TypeScript, Node.js + Express, and PostgreSQL.

## Features in this starter
- List transactions
- Add income or expense transactions
- Delete transactions
- Summary totals (income, expenses, balance)
- PostgreSQL persistence
- Basic API validation and error handling

## Requirements
- Node.js 20+ and npm
- Docker Desktop (for local PostgreSQL)

## Run locally
1. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```
2. Install dependencies from the project root:
   ```bash
   npm install
   ```
3. Create `server/.env` by copying `server/.env.example`:
   ```bash
   cp server/.env.example server/.env
   ```
4. Start frontend and backend:
   ```bash
   npm run dev
   ```
5. Open http://localhost:5173

API health check: http://localhost:4000/api/health

## API routes
- `GET /api/transactions`
- `POST /api/transactions`
- `DELETE /api/transactions/:id`
- `GET /api/summary`

## Important
This is a local learning project, not a production financial application. Do not enter real sensitive financial data. Authentication, authorization, migrations, and production deployment are not included yet.
