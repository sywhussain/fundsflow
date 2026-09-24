import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Plus, Trash2, Wallet } from "lucide-react";

type Kind = "income" | "expense";
type Transaction = {
  id: number;
  description: string;
  amount: number;
  kind: Kind;
  category: string;
  date: string;
};
type Summary = { income: number; expenses: number; balance: number };

const API = "http://localhost:4000/api";
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expenses: 0, balance: 0 });
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<Kind>("expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setError("");
    try {
      const [txResponse, summaryResponse] = await Promise.all([
        fetch(`${API}/transactions`),
        fetch(`${API}/summary`)
      ]);
      if (!txResponse.ok || !summaryResponse.ok) throw new Error("The API returned an error.");
      setTransactions(await txResponse.json());
      setSummary(await summaryResponse.json());
    } catch {
      setError("Couldn't reach the API. Check that the backend and PostgreSQL are running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount: Number(amount), kind, category, date })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not add transaction.");
      setDescription("");
      setAmount("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function removeTransaction(id: number) {
    try {
      const response = await fetch(`${API}/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete transaction.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const visibleTransactions = useMemo(
    () => filter === "all" ? transactions : transactions.filter((item) => item.kind === filter),
    [transactions, filter]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><CircleDollarSign size={22} /></span><span>Funds<span>Flow</span></span></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><Wallet size={18} /> Overview</div>
        <div className="sidebar-note"><div className="note-dot" />Your money, in focus.</div>
        <div className="sidebar-bottom">PERSONAL FINANCE<br/><span>LOCAL DEMO</span></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><div className="eyebrow">YOUR FINANCIAL SPACE</div><h1>Overview</h1></div>
          <div className="today-pill">● <span>Personal workspace</span></div>
        </header>

        <section className="welcome">
          <div><p className="eyebrow light">FINANCIAL SNAPSHOT</p><h2>Make every rupee<br/>count.</h2><p className="welcome-sub">A clearer view of what comes in and what goes out.</p></div>
          <div className="welcome-icon"><Wallet size={44} strokeWidth={1.4}/></div>
          <div className="orb orb-one"/><div className="orb orb-two"/>
        </section>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <section className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Total balance</span><span className="stat-icon"><Wallet size={17}/></span></div><div className="stat-value">{money(summary.balance)}</div><div className="stat-foot">Income minus expenses</div></article>
          <article className="stat-card"><div className="stat-top"><span>Total income</span><span className="stat-icon green"><ArrowDownLeft size={17}/></span></div><div className="stat-value">{money(summary.income)}</div><div className="stat-foot">Money received</div></article>
          <article className="stat-card"><div className="stat-top"><span>Total expenses</span><span className="stat-icon orange"><ArrowUpRight size={17}/></span></div><div className="stat-value">{money(summary.expenses)}</div><div className="stat-foot">Money spent</div></article>
        </section>

        <section className="main-grid">
          <article className="panel transactions-panel">
            <div className="panel-heading"><div><p className="eyebrow">ACTIVITY</p><h3>Transactions</h3></div><select aria-label="Filter transactions" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">All activity</option><option value="income">Income</option><option value="expense">Expenses</option></select></div>
            {loading ? <p className="empty-state">Loading transactions…</p> : visibleTransactions.length === 0 ? <p className="empty-state">No transactions yet. Add your first one.</p> : (
              <div className="transaction-list">{visibleTransactions.map((item) => <div className="transaction-row" key={item.id}>
                <div className={`transaction-symbol ${item.kind}`}>{item.kind === "income" ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}</div>
                <div className="transaction-main"><strong>{item.description}</strong><span>{item.category} · {item.date}</span></div>
                <div className={`transaction-amount ${item.kind}`}>{item.kind === "income" ? "+" : "−"}{money(item.amount)}</div>
                <button className="delete-button" aria-label={`Delete ${item.description}`} onClick={() => void removeTransaction(item.id)}><Trash2 size={16}/></button>
              </div>)}</div>
            )}
          </article>

          <article className="panel form-panel">
            <div className="panel-heading"><div><p className="eyebrow">QUICK ENTRY</p><h3>Add transaction</h3></div><span className="plus-badge"><Plus size={18}/></span></div>
            <form onSubmit={(event) => void handleSubmit(event)} className="transaction-form">
              <label>Description<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Monthly salary" required maxLength={100}/></label>
              <label>Amount (₹)<input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required/></label>
              <div className="form-two">
                <label>Type<select value={kind} onChange={(e) => setKind(e.target.value as Kind)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
                <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{["Food","Transport","Housing","Salary","Shopping","Bills","Health","Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
              <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required/></label>
              <button className="submit-button" type="submit"><Plus size={17}/> Add transaction</button>
            </form>
          </article>
        </section>
        <footer>FundsFlow <span>·</span> Built for learning full-stack development</footer>
      </section>
    </main>
  );
}