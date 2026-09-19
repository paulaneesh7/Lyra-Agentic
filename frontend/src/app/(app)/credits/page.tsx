"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Layers, MessageCircle, Wallet } from "lucide-react";
import { useMemo } from "react";
import { CreditTransactionLedger } from "@/components/credits/transaction-ledger";
import { ScreenLoader } from "@/components/ui/loader";
import { prefetchCreditsData, useCreditsData } from "@/lib/credits-data";
import { cn } from "@/lib/utils";

const PLAN_BLURBS: Record<string, string> = {
  starter: "Try Lyra",
  popular: "Serious preparation",
  pro: "Heavy AI usage",
};

function packValue(credits: number, evalCost: number, flashCost: number) {
  return {
    evals: evalCost > 0 ? Math.floor(credits / evalCost) : 0,
    decks: flashCost > 0 ? Math.floor(credits / flashCost) : 0,
    cards: flashCost > 0 ? Math.floor(credits / flashCost) * 8 : 0,
  };
}

export default function CreditsPage() {
  const { data, loading } = useCreditsData();

  const evalCost = data?.costs?.evaluation ?? 10;
  const flashCost = data?.costs?.flashcard_generation ?? 5;

  const plans = useMemo(() => {
    if (!data) return [];
    return [...data.plans].sort((a, b) => a.price_inr - b.price_inr);
  }, [data]);

  if (loading && !data) return <ScreenLoader />;
  if (!data) return <ScreenLoader />;

  const recent = data.transactions.slice(0, 5);
  const hasMore = data.transactions.length > 5;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10 sm:space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Credits</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
            Pay as you go — no subscription. Buy a pack and use credits on evaluations or flashcards.
          </p>
        </div>
        <Link
          href="/credits/history"
          onMouseEnter={prefetchCreditsData}
          onFocus={prefetchCreditsData}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium transition hover:bg-[var(--bg-muted)] sm:self-auto"
        >
          Credit history <ArrowRight size={14} />
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[linear-gradient(135deg,var(--accent-soft)_0%,var(--bg-elevated)_48%,var(--flash-soft)_100%)] p-5 shadow-[var(--shadow)] sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--accent)] opacity-[0.07] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[var(--flash)] opacity-[0.08] blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] ring-1 ring-[var(--line)]">
                <Wallet size={16} />
              </span>
              Available balance
            </div>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight sm:text-6xl">{data.balance}</span>
              <span className="text-base text-[var(--text-muted)]">credits</span>
            </p>
          </div>
          <p className="max-w-[14rem] text-xs leading-relaxed text-[var(--text-muted)] sm:text-right">
            New accounts get 75 free credits to start evaluating and generating decks.
          </p>
        </div>

        <div className="relative mt-6 grid gap-3 border-t border-[var(--line)]/70 pt-5 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl bg-[var(--bg-elevated)]/70 px-3.5 py-3 ring-1 ring-[var(--line)]/80 backdrop-blur-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <ClipboardList size={18} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium">
                ≈{data.estimated_evaluations} evaluation
                {data.estimated_evaluations === 1 ? "" : "s"} left
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{evalCost} credits each</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-[var(--bg-elevated)]/70 px-3.5 py-3 ring-1 ring-[var(--line)]/80 backdrop-blur-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--flash-soft)] text-[var(--flash)]">
              <Layers size={18} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium">
                ≈{data.estimated_flashcard_generations} flashcard deck
                {data.estimated_flashcard_generations === 1 ? "" : "s"} you can generate
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {flashCost} credits per generation
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 sm:mb-5">
          <h2 className="text-lg font-semibold tracking-tight">Buy a pack</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Payments via DodoPayments coming soon — packs are ready to wire up.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const highlight =
              Boolean(plan.badge) &&
              /popular|most|focus/i.test(`${plan.badge} ${plan.code} ${plan.name}`);
            const value = packValue(plan.credits, evalCost, flashCost);
            const blurb = PLAN_BLURBS[plan.code] ?? "Prepaid credits";

            return (
              <article
                key={plan.code || plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-[var(--bg-elevated)] p-5 transition duration-300 sm:p-6",
                  highlight
                    ? "border-[var(--accent)] shadow-[0_16px_40px_var(--ring)] lg:-translate-y-1"
                    : "border-[var(--line)] hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow)]",
                )}
              >
                {plan.badge && (
                  <span
                    className={cn(
                      "absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-semibold",
                      highlight
                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                        : "bg-[var(--accent-soft)] text-[var(--accent)]",
                    )}
                  >
                    {plan.badge === "Popular" ? "Most Popular" : plan.badge}
                  </span>
                )}

                <div className={cn(plan.badge && "pt-2")}>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{blurb}</p>
                </div>

                <p className="mt-5">
                  <span className="text-3xl font-semibold tracking-tight">₹{plan.price_inr}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {plan.credits.toLocaleString()} credits
                </p>

                <div
                  className={cn(
                    "mt-5 flex-1 rounded-xl px-3.5 py-3 text-sm leading-relaxed",
                    highlight ? "bg-[var(--accent-soft)]" : "bg-[var(--bg-muted)]",
                  )}
                >
                  Good for up to{" "}
                  <span className="font-semibold text-[var(--flash)]">≈{value.evals}</span> GATE
                  evaluations <span className="text-[var(--text-muted)]">OR</span>{" "}
                  <span className="font-semibold text-[var(--flash)]">≈{value.decks}</span> flashcard
                  decks
                  {value.cards > 0 && (
                    <span className="text-[var(--text-muted)]">
                      {" "}
                      (~{value.cards.toLocaleString()} flashcards)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled
                  className={cn(
                    "mt-5 w-full rounded-md py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-80",
                    highlight
                      ? "bg-[var(--accent)] text-[var(--accent-text)]"
                      : "border border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text)]",
                  )}
                >
                  Buy credits — soon
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow)] sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">How credits are spent</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pay only when you use an AI feature. Reviewing flashcards and failed evaluations on our side
          are free.
        </p>

        <ul className="mt-5 divide-y divide-[var(--line)]">
          <li className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <ClipboardList size={17} />
              </span>
              <span className="text-sm font-medium">GATE Evaluation</span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--accent)]">
              {evalCost} credits
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--flash-soft)] text-[var(--flash)]">
                <Layers size={17} />
              </span>
              <span className="text-sm font-medium">Flashcard Generation</span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--accent)]">
              {flashCost} credits
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--bg-muted)] text-[var(--text-muted)]">
                <MessageCircle size={17} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Evaluation Follow-up Chat</span>
                  <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                    Free
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Includes follow-up messages on each scored evaluation.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--accent)]">₹0</span>
          </li>
        </ul>

        <div className="mt-5 flex flex-col gap-2 border-t border-[var(--line)] pt-5 sm:flex-row sm:gap-3">
          <Link
            href="/evaluation"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-text)] transition hover:bg-[var(--accent-hover)]"
          >
            Evaluate an answer <ArrowRight size={14} />
          </Link>
          <Link
            href="/flashcards"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--bg-muted)]"
          >
            Create flashcards <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Latest movements on your wallet
            </p>
          </div>
          <Link
            href="/credits/history"
            onMouseEnter={prefetchCreditsData}
            onFocus={prefetchCreditsData}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
          >
            View full history <ArrowRight size={14} />
          </Link>
        </div>

        <CreditTransactionLedger
          transactions={recent}
          showFilters={false}
          showSummary={false}
          compact
          emptyHint="No movements yet. Your first evaluation or flashcard generation will show up here."
        />

        {hasMore && (
          <div className="mt-4 border-t border-[var(--line)] pt-4 text-center">
            <Link
              href="/credits/history"
              onMouseEnter={prefetchCreditsData}
              onFocus={prefetchCreditsData}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--bg-muted)]"
            >
              See all {data.transactions.length} transactions <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
