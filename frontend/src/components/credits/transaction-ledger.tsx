"use client";

import { useMemo, useState } from "react";
import type { CreditTx } from "@/lib/credits-ui";
import {
  creditTxMeta,
  formatCreditTime,
  groupCreditTxByDay,
  summarizeCreditTx,
} from "@/lib/credits-ui";
import { cn } from "@/lib/utils";

type Filter = "all" | "spend" | "add";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "spend", label: "Spent" },
  { id: "add", label: "Added" },
];

function accentBar(tone: ReturnType<typeof creditTxMeta>["tone"]) {
  switch (tone) {
    case "flash":
      return "bg-[var(--flash)]";
    case "accent":
      return "bg-[var(--accent)]";
    case "credit":
      return "bg-emerald-500";
    default:
      return "bg-[var(--line)]";
  }
}

function iconTone(tone: ReturnType<typeof creditTxMeta>["tone"]) {
  switch (tone) {
    case "flash":
      return "text-[var(--flash)]";
    case "accent":
      return "text-[var(--accent)]";
    case "credit":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return "text-[var(--text-muted)]";
  }
}

export function CreditTransactionLedger({
  transactions,
  limit,
  showFilters = true,
  showSummary = true,
  emptyHint = "No movements yet. Your first evaluation or flashcard generation will show up here.",
  compact = false,
}: {
  transactions: CreditTx[];
  limit?: number;
  showFilters?: boolean;
  showSummary?: boolean;
  emptyHint?: string;
  /** Tighter rows for the credits-page preview. */
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? transactions
        : transactions.filter((tx) => {
            const category = creditTxMeta(tx.type, tx.amount).category;
            if (filter === "add") return category === "add" || category === "adjust";
            return category === "spend";
          });
    return typeof limit === "number" ? list.slice(0, limit) : list;
  }, [transactions, filter, limit]);

  const groups = useMemo(() => groupCreditTxByDay(filtered), [filtered]);
  const summary = useMemo(() => summarizeCreditTx(transactions), [transactions]);

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      {(showSummary || showFilters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showSummary ? (
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)]">
              {[
                { label: "Spent", value: summary.spent, prefix: summary.spent ? "−" : "" },
                {
                  label: "Added",
                  value: summary.added,
                  prefix: summary.added ? "+" : "",
                  positive: true,
                },
                {
                  label: "Net",
                  value: Math.abs(summary.net),
                  prefix: summary.net > 0 ? "+" : summary.net < 0 ? "−" : "",
                  positive: summary.net >= 0,
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-[var(--bg-elevated)] px-3 py-2.5 sm:px-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-sm font-semibold tabular-nums tracking-tight",
                      stat.positive
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-[var(--text)]",
                    )}
                  >
                    {stat.prefix}
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div />
          )}

          {showFilters && (
            <div
              role="tablist"
              aria-label="Filter transactions"
              className="inline-flex self-start rounded-md border border-[var(--line)] p-0.5 sm:self-auto"
            >
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "rounded-[5px] px-3 py-1.5 text-xs font-medium transition",
                    filter === item.id
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-[var(--line)] pb-2">
                <h3 className="text-xs font-semibold tracking-wide text-[var(--text)]">
                  {group.label}
                </h3>
                <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                  {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <ul className="divide-y divide-[var(--line)]/80">
                {group.items.map((tx) => {
                  const meta = creditTxMeta(tx.type, tx.amount);
                  const Icon = meta.icon;
                  const credit = tx.amount >= 0;

                  return (
                    <li
                      key={tx.id}
                      className={cn(
                        "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 transition-colors hover:bg-[var(--bg-muted)]/40 sm:gap-4",
                        compact ? "py-2.5" : "py-3.5",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-2 bottom-2 left-0 w-[2px] rounded-full opacity-80",
                          accentBar(meta.tone),
                        )}
                        aria-hidden
                      />

                      <span
                        className={cn(
                          "ml-2.5 grid place-items-center rounded-md border border-[var(--line)] bg-[var(--bg)]",
                          compact ? "h-8 w-8" : "h-9 w-9",
                          iconTone(meta.tone),
                        )}
                      >
                        <Icon size={compact ? 14 : 15} strokeWidth={1.75} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium tracking-tight">{meta.label}</p>
                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                          <span className="font-mono tabular-nums">
                            {formatCreditTime(tx.created_at)}
                          </span>
                          {tx.note ? (
                            <>
                              <span className="mx-1.5 text-[var(--line)]">·</span>
                              {tx.note}
                            </>
                          ) : null}
                          <span className="mx-1.5 text-[var(--line)]">·</span>
                          <span className="tabular-nums">bal {tx.balance_after}</span>
                        </p>
                      </div>

                      <p
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums tracking-tight",
                          credit
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-[var(--text)]",
                        )}
                      >
                        {credit ? "+" : "−"}
                        {Math.abs(tx.amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
