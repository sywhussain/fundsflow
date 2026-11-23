import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { Summary } from "../types";
import { formatMoney } from "../utils/format";

interface SummaryCardsProps {
  summary: Summary;
  loading: boolean;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  return (
    <section className="stats-grid" aria-label="Financial summary">
      <article className="stat-card">
        <div className="stat-top">
          <span>Total balance</span>
          <span className="stat-icon">
            <Wallet size={17} />
          </span>
        </div>
        <div className="stat-value">{loading ? "—" : formatMoney(summary.balance)}</div>
        <div className="stat-foot">Income minus expenses</div>
      </article>

      <article className="stat-card">
        <div className="stat-top">
          <span>Total income</span>
          <span className="stat-icon green">
            <ArrowDownLeft size={17} />
          </span>
        </div>
        <div className="stat-value">{loading ? "—" : formatMoney(summary.income)}</div>
        <div className="stat-foot">Money received</div>
      </article>

      <article className="stat-card">
        <div className="stat-top">
          <span>Total expenses</span>
          <span className="stat-icon orange">
            <ArrowUpRight size={17} />
          </span>
        </div>
        <div className="stat-value">{loading ? "—" : formatMoney(summary.expenses)}</div>
        <div className="stat-foot">Money spent</div>
      </article>
    </section>
  );
}