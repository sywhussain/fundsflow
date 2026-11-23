export type Kind = "income" | "expense";

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  kind: Kind;
  category: string;
  date: string;
}

export interface TransactionInput {
  description: string;
  amount: number;
  kind: Kind;
  category: string;
  date: string;
}

export interface Summary {
  income: number;
  expenses: number;
  balance: number;
}

export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Salary",
  "Shopping",
  "Bills",
  "Health",
  "Other"
] as const;