import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, RefreshCw, Wallet } from "lucide-react";
import {
  createTransaction,
  deleteTransaction,
  fetchSummary,
  fetchTransactions,
  updateTransaction
} from "./api";
import { SummaryCards } from "./components/SummaryCards";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { Kind, Summary, Transaction, TransactionInput } from "./types";

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expenses: 0, balance: 0 });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | Kind>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [txData, summaryData] = await Promise.all([fetchTransactions(), fetchSummary()]);
      setTransactions(txData);
      setSummary(summaryData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the API. Check that the backend and PostgreSQL are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFormSubmit(input: TransactionInput, editingId: number | null): Promise<boolean> {
    setError("");
    setSubmitting(true);
    try {
      if (editingId !== null) {
        await updateTransaction(editingId, input);
        setEditingTransaction(null);
      } else {
        await createTransaction(input);
      }
      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save transaction.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError("");
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      if (editingTransaction?.id === id) {
        setEditingTransaction(null);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete transaction.");
    } finally {
      setDeletingId(null);
    }
  }

  const visibleTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (
        query &&
        !item.description.toLowerCase().includes(query) &&
        !item.category.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, kindFilter, categoryFilter, searchQuery]);

  function clearFilters() {
    setSearchQuery("");
    setKindFilter("all");
    setCategoryFilter("all");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <CircleDollarSign size={22} />
          </span>
          <span>
            Funds<span>Flow</span>
          </span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active">
          <Wallet size={18} /> Overview
        </div>
        <div className="sidebar-note">
          <div className="note-dot" />
          Your money, in focus.
        </div>
        <div className="sidebar-bottom">
          PERSONAL FINANCE
          <br />
          <span>SINGLE-USER WORKSPACE</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">YOUR FINANCIAL SPACE</div>
            <h1>Overview</h1>
          </div>
          <div className="today-pill">
            ● <span>Personal workspace</span>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow light">FINANCIAL SNAPSHOT</p>
            <h2>
              Make every rupee
              <br />
              count.
            </h2>
            <p className="welcome-sub">A clearer view of what comes in and what goes out.</p>
          </div>
          <div className="welcome-icon">
            <Wallet size={44} strokeWidth={1.4} />
          </div>
          <div className="orb orb-one" />
          <div className="orb orb-two" />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="retry-button"
              onClick={() => {
                setLoading(true);
                void refresh();
              }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        <SummaryCards summary={summary} loading={loading} />

        <section className="main-grid">
          <TransactionList
            transactions={visibleTransactions}
            totalCount={transactions.length}
            loading={loading}
            editingId={editingTransaction?.id ?? null}
            deletingId={deletingId}
            searchQuery={searchQuery}
            kindFilter={kindFilter}
            categoryFilter={categoryFilter}
            onSearchChange={setSearchQuery}
            onKindFilterChange={setKindFilter}
            onCategoryFilterChange={setCategoryFilter}
            onClearFilters={clearFilters}
            onEdit={(tx) => {
              setError("");
              setEditingTransaction(tx);
            }}
            onDelete={handleDelete}
          />

          <TransactionForm
            editingTransaction={editingTransaction}
            submitting={submitting}
            onSubmit={handleFormSubmit}
            onCancelEdit={() => setEditingTransaction(null)}
          />
        </section>

        <footer>
          FundsFlow <span>·</span> Personal finance tracker built with React, Express &amp; PostgreSQL
        </footer>
      </section>
    </main>
  );
}