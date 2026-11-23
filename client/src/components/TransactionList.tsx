import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, Search, Trash2 } from "lucide-react";
import { CATEGORIES, Kind, Transaction } from "../types";
import { formatMoney } from "../utils/format";

interface TransactionListProps {
  transactions: Transaction[];
  totalCount: number;
  loading: boolean;
  editingId: number | null;
  deletingId: number | null;
  searchQuery: string;
  kindFilter: "all" | Kind;
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onKindFilterChange: (value: "all" | Kind) => void;
  onCategoryFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => Promise<void>;
}

export function TransactionList({
  transactions,
  totalCount,
  loading,
  editingId,
  deletingId,
  searchQuery,
  kindFilter,
  categoryFilter,
  onSearchChange,
  onKindFilterChange,
  onCategoryFilterChange,
  onClearFilters,
  onEdit,
  onDelete
}: TransactionListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const hasActiveFilters = searchQuery.trim() !== "" || kindFilter !== "all" || categoryFilter !== "all";

  return (
    <article className="panel transactions-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ACTIVITY</p>
          <h3>Transactions</h3>
        </div>
        <span className="count-pill">
          {transactions.length}
          {hasActiveFilters ? ` of ${totalCount}` : ""}
        </span>
      </div>

      <div className="filter-bar">
        <label className="search-input">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search transactions"
            placeholder="Search description or category…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <select
          aria-label="Filter by type"
          value={kindFilter}
          onChange={(e) => onKindFilterChange(e.target.value as "all" | Kind)}
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="empty-state">Loading transactions…</p>
      ) : totalCount === 0 ? (
        <p className="empty-state">No transactions yet. Add your first one using the form.</p>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions match the current filters.</p>
          <button type="button" className="clear-filters-btn" onClick={onClearFilters}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((item) => {
            const isDeleting = deletingId === item.id;
            const isConfirming = confirmDeleteId === item.id;

            return (
              <div
                className={`transaction-row ${editingId === item.id ? "editing" : ""}`}
                key={item.id}
              >
                <div className={`transaction-symbol ${item.kind}`}>
                  {item.kind === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>

                <div className="transaction-main">
                  <strong>{item.description}</strong>
                  <span>
                    {item.category} · {item.date}
                  </span>
                </div>

                <div className={`transaction-amount ${item.kind}`}>
                  {item.kind === "income" ? "+" : "−"}
                  {formatMoney(item.amount)}
                </div>

                <div className="row-actions">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        className="confirm-delete-btn"
                        disabled={isDeleting}
                        onClick={() => {
                          setConfirmDeleteId(null);
                          void onDelete(item.id);
                        }}
                      >
                        {isDeleting ? "Deleting…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        className="cancel-delete-btn"
                        disabled={isDeleting}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="edit-button"
                        type="button"
                        aria-label={`Edit ${item.description}`}
                        disabled={isDeleting}
                        onClick={() => onEdit(item)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="delete-button"
                        type="button"
                        aria-label={`Delete ${item.description}`}
                        disabled={isDeleting}
                        onClick={() => setConfirmDeleteId(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}