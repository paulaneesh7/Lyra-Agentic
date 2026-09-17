"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScreenLoader } from "@/components/ui/loader";
import { api } from "@/lib/api";

type Credits = {
  balance: number;
  estimated_evaluations: number;
  estimated_flashcard_generations: number;
  transactions: { id: string; amount: number; type: string; created_at: string; balance_after: number }[];
  plans: { name: string; price_inr: number; credits: number; badge: string | null }[];
};

export default function CreditsPage() {
  const [data, setData] = useState<Credits | null>(null);
  useEffect(() => {
    api<Credits>("/api/credits").then(setData);
  }, []);
  if (!data) return <ScreenLoader />;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Credits</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>Available <p className="mt-2 text-3xl font-semibold">{data.balance}</p></Card>
        <Card>Est. evaluations <p className="mt-2 text-3xl font-semibold">{data.estimated_evaluations}</p></Card>
        <Card>Est. flashcard runs <p className="mt-2 text-3xl font-semibold">{data.estimated_flashcard_generations}</p></Card>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {data.plans.map((p) => (
          <Card key={p.name}>
            {p.badge && <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]">{p.badge}</span>}
            <h2 className="mt-2 text-xl font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm">₹{p.price_inr} · {p.credits} credits</p>
            <p className="mt-3 text-xs text-[var(--text-muted)]">Placeholder plan. Payments are not enabled yet.</p>
            <button className="mt-4 w-full rounded-md bg-[var(--bg-muted)] py-2 text-sm" disabled>Purchase (soon)</button>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-medium">Transaction history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.transactions.length === 0 && <li className="text-[var(--text-muted)]">No movements yet.</li>}
          {data.transactions.map((t) => (
            <li key={t.id} className="flex justify-between">
              <span>{t.type}</span>
              <span>{t.amount} → {t.balance_after}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
