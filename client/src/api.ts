import { Summary, Transaction, TransactionInput } from "./types";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE}/transactions`);
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not load transactions."));
  }
  return (await response.json()) as Transaction[];
}

export async function fetchSummary(): Promise<Summary> {
  const response = await fetch(`${API_BASE}/summary`);
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not load summary."));
  }
  return (await response.json()) as Summary;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not add transaction."));
  }
  return (await response.json()) as Transaction;
}

export async function updateTransaction(id: number, input: TransactionInput): Promise<Transaction> {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not update transaction."));
  }
  return (await response.json()) as Transaction;
}

export async function deleteTransaction(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Could not delete transaction."));
  }
}