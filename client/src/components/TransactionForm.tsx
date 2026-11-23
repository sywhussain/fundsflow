import { FormEvent, useEffect, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { CATEGORIES, Kind, Transaction, TransactionInput } from "../types";
import { getLocalToday } from "../utils/format";

interface TransactionFormProps {
  editingTransaction: Transaction | null;
  submitting: boolean;
  onSubmit: (input: TransactionInput, editingId: number | null) => Promise<boolean>;
  onCancelEdit: () => void;
}

export function TransactionForm({
  editingTransaction,
  submitting,
  onSubmit,
  onCancelEdit
}: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<Kind>("expense");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState<string>(getLocalToday);

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(String(editingTransaction.amount));
      setKind(editingTransaction.kind);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
    } else {
      setDescription("");
      setAmount("");
      setKind("expense");
      setCategory("Food");
      setDate(getLocalToday());
    }
  }, [editingTransaction]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onSubmit(
      {
        description: description.trim(),
        amount: Number(amount),
        kind,
        category,
        date
      },
      editingTransaction ? editingTransaction.id : null
    );
    if (ok && !editingTransaction) {
      setDescription("");
      setAmount("");
      setDate(getLocalToday());
    }
  }

  const isEditing = editingTransaction !== null;

  return (
    <article className="panel form-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{isEditing ? "EDIT ENTRY" : "QUICK ENTRY"}</p>
          <h3>{isEditing ? "Edit transaction" : "Add transaction"}</h3>
        </div>
        <span className="plus-badge">{isEditing ? <Pencil size={16} /> : <Plus size={18} />}</span>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="transaction-form">
        <label>
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly salary"
            required
            maxLength={100}
            disabled={submitting}
          />
        </label>

        <label>
          Amount (₹)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            placeholder="0.00"
            required
            disabled={submitting}
          />
        </label>

        <div className="form-two">
          <label>
            Type
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} disabled={submitting}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={submitting}
          />
        </label>

        <div className="form-actions">
          <button className="submit-button" type="submit" disabled={submitting}>
            {isEditing ? <Check size={17} /> : <Plus size={17} />}
            {submitting ? "Saving…" : isEditing ? "Save changes" : "Add transaction"}
          </button>
          {isEditing && (
            <button
              className="cancel-button"
              type="button"
              onClick={onCancelEdit}
              disabled={submitting}
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </form>
    </article>
  );
}