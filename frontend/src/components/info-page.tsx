"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function InfoPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo hideSubtitleOnMobile />
          <ThemeToggle />
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--bg-muted)]"
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
          Back to homepage
        </Link>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">{lede}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[var(--text)]">{children}</div>
      </article>
    </main>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-2 text-[var(--text-muted)]">{children}</div>
    </section>
  );
}
