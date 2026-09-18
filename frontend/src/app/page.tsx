"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Layers,
  Menu,
  MessageCircle,
  Minus,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { HeroDemo } from "@/components/landing/hero-demo";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  "Engineering Mathematics",
  "Programming & DS",
  "Algorithms",
  "Theory of Computation",
  "Compiler Design",
  "Operating Systems",
  "Databases",
  "Computer Networks",
  "Computer Organization",
  "Digital Logic",
  "Discrete Mathematics",
  "General Aptitude",
];

const RUBRIC = [
  ["Approach", 88],
  ["Correctness", 82],
  ["Completeness", 76],
  ["Notation", 84],
  ["Complexity", 80],
  ["Edge cases", 72],
];

const COMPARE = [
  ["Turnaround", "< 3 minutes", "1–3 days"],
  ["GATE CS rubric", true, false],
  ["Typed + handwritten input", true, false],
  ["Topic-wise flashcards", true, false],
  ["Score trend over attempts", true, false],
  ["Prepaid credits (no subscription)", true, false],
];

const PLANS = [
  { name: "Starter", price: 99, credits: 100, evals: 10, decks: 20, badge: null, highlight: false },
  { name: "Focus", price: 499, credits: 550, evals: 55, decks: 110, badge: "Most used", highlight: true },
  { name: "Intensive", price: 999, credits: 1200, evals: 120, decks: 240, badge: "Best value", highlight: false },
];

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function goApp() {
    setMenuOpen(false);
    router.push(user ? "/dashboard" : "/login");
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg)]">
      <header className="sticky top-0 z-50 border-b border-[var(--line)]/80 bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
          <Logo subtitle="Practice · Evaluate · Qualify" />
          <nav className="hidden items-center gap-8 text-sm text-[var(--text-muted)] md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative transition hover:text-[var(--text)] after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--accent)] after:transition-all hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                aria-label="Open workspace"
                className="grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90"
              >
                <UserAvatar name={user.full_name} src={user.avatar_url} size={28} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden px-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--text)] sm:inline"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={goApp}
              className="hidden rounded-full bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-[var(--accent-text)] shadow-[0_8px_20px_var(--ring)] transition hover:bg-[var(--accent-hover)] md:inline-flex"
            >
              Get started
            </button>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — Kaizen-style sheet with haze */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-[color-mix(in_srgb,var(--text)_28%,transparent)] backdrop-blur-[8px] transition-opacity duration-300 ease-out",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={cn(
            "relative mx-0 overflow-hidden rounded-b-2xl border-b border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_24px_60px_rgba(20,16,32,0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3.5">
            <Logo subtitle="Write. Evaluate. Qualify." />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] transition hover:bg-[var(--bg-muted)]"
              aria-label="Close menu"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          <nav className="px-2 pb-4">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block border-t border-[var(--line)] px-3 py-3.5 text-[15px] font-medium text-[var(--text)] transition active:bg-[var(--bg-muted)]"
              >
                {item.label}
              </a>
            ))}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block border-t border-[var(--line)] px-3 py-3.5 text-[15px] font-medium text-[var(--text-muted)]"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={goApp}
              className="mt-3 mb-1 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-text)] shadow-[0_10px_24px_var(--ring)]"
            >
              {user ? "Open workspace" : "Get started"}
            </button>
          </nav>
        </div>
      </div>

      <section className="relative overflow-hidden">
        <div className="lyra-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="lyra-orb pointer-events-none absolute -top-28 right-[-5rem] h-72 w-72 rounded-full bg-[var(--accent)]/18 blur-3xl" />
        <div className="lyra-orb-2 pointer-events-none absolute top-48 left-[-6rem] h-64 w-64 rounded-full bg-[var(--accent)]/12 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-5 md:grid-cols-2 md:gap-12 md:py-20">
          <div>
            <p className="lyra-rise inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
              <Sparkles size={13} />
              Submit a solution. Get GATE-aware feedback.
            </p>
            <h1 className="lyra-rise lyra-rise-1 mt-5 text-[2.2rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-[2.85rem]">
              Practice smarter.
              <br />
              Write clearer{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_70%,#c4a8f0)] bg-clip-text text-transparent">
                GATE
              </span>{" "}
              answers.
            </h1>
            <p className="lyra-rise lyra-rise-2 mt-5 max-w-md text-sm leading-relaxed text-[var(--text-muted)] md:text-[15px]">
              Type or photograph a GATE CS solution. Lyra scores the approach, flags missing cases, and shows what a
              high-scoring answer usually includes — in a few minutes, not a few days.
            </p>
            <div className="lyra-rise lyra-rise-3 mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={goApp}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-text)] shadow-[0_12px_32px_var(--ring)] transition hover:bg-[var(--accent-hover)] hover:shadow-[0_14px_36px_var(--ring)]"
              >
                Get started <ArrowRight size={16} />
              </button>
              <a
                href="#product"
                className="rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-5 py-2.5 text-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                See a sample report
              </a>
            </div>
            <div className="lyra-rise lyra-rise-4 mt-10 grid grid-cols-3 divide-x divide-[var(--line)] text-left">
              {[
                ["< 3 min", "Evaluation time"],
                ["6", "Rubric criteria"],
                ["24/7", "Practice feedback"],
              ].map(([value, label]) => (
                <div key={label} className="px-3 first:pl-0 last:pr-0 sm:px-4">
                  <p className="text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lyra-rise lyra-rise-3 relative">
            <div className="pointer-events-none absolute -inset-3 rounded-2xl bg-[var(--accent)]/8 blur-2xl" />
            <div className="relative">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[var(--line)] bg-[var(--bg-elevated)]/40 py-3">
        <div className="lyra-marquee flex w-max gap-2">
          {[...SUBJECTS, ...SUBJECTS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <section id="product" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-5 md:grid-cols-[1.15fr_0.85fr] md:py-20">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">The output</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">See what to fix, not just a score.</h2>
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">GATE CS · Operating Systems</p>
                <p className="text-xs text-[var(--text-muted)]">NAT · fork() process count</p>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-sm font-semibold text-[var(--accent)]">
                8.5/10
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {RUBRIC.map(([label, score]) => (
                <div key={String(label)}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span>{label}</span>
                    <span className="tabular-nums text-[var(--text-muted)]">{score}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="lyra-bar h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="rounded-xl bg-[var(--bg)] px-3 py-2.5">Clear 2ⁿ recurrence with the parent subtracted.</li>
              <li className="rounded-xl bg-[var(--bg)] px-3 py-2.5 text-[var(--text-muted)]">
                Add the failed-fork case — GATE often awards that extra step.
              </li>
            </ul>
          </div>
        </div>
        <div className="space-y-3 md:pt-16">
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Six GATE-style checks with comments and an overall mark out of 10.
          </p>
          {(
            [
              [Sparkles, "GATE CS rubric", "Approach, correctness, completeness, notation, complexity, and edge cases."],
              [MessageCircle, "Follow-up chat", "Ask why a mark was lost or how to tighten a derivation."],
              [Layers, "Flashcards", "Topic decks from the GATE CS syllabus. Review is free."],
            ] as const
          ).map(([Icon, title, copy]) => (
            <div
              key={title}
              className="group rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 transition hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] transition group-hover:scale-105">
                <Icon size={16} />
              </span>
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-[var(--line)] bg-[var(--bg-elevated)]/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-5 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Upload. Evaluate.
              <br />
              Improve.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              Bring your own GATE questions — previous papers, coaching sheets, or a problem you just attempted. No locked
              question bank required.
            </p>
          </div>
          <ol className="space-y-5">
            {[
              ["Add the question", "Paste it or photograph the paper — we extract the text."],
              ["Add your solution", "Type the steps or upload up to four sheets."],
              ["Get scored feedback", "Rubric marks, gaps, and a cleaner approach for next time."],
            ].map(([title, copy], i) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-5 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Comparison</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            More than a mark. A clearer path to GATE CS.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
            Instant, structured feedback so you can see where an answer stands against a high-scoring GATE pattern — not a
            vague “good attempt”.
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-[var(--bg)] text-left text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">What you get</th>
                  <th className="px-4 py-3 font-medium">{brand.short}</th>
                  <th className="px-4 py-3 font-medium">Typical review</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, lyra, other]) => (
                  <tr key={String(label)} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">{label as string}</td>
                    <td className="px-4 py-3">
                      {lyra === true ? (
                        <Check size={16} className="text-[var(--accent)]" />
                      ) : (
                        <span>{lyra as string}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {other === false ? <Minus size={16} /> : <span>{other as string}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Comparison is illustrative. Features and timing vary by coaching centre.
          </p>
        </div>
      </section>

      <section id="pricing" className="border-t border-[var(--line)] bg-[var(--bg-elevated)]/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-5 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Prepaid packs. No subscription.</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Buy credits once. Spend them on evaluations, flashcard generation, or both. Reviewing cards is free.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]",
                  plan.highlight
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_16px_40px_var(--ring)]"
                    : "border-[var(--line)] bg-[var(--bg-elevated)]",
                )}
              >
                {plan.badge && (
                  <p className="mb-3 text-center text-[11px] font-medium text-[var(--accent)]">{plan.badge}</p>
                )}
                <p className="text-center text-sm text-[var(--text-muted)]">{plan.name}</p>
                <p className="mt-2 text-center text-3xl font-semibold tracking-tight">₹{plan.price}</p>
                <p className="mt-1 text-center text-xs text-[var(--text-muted)]">{plan.credits} credits</p>
                <p className="mt-6 text-center text-sm">
                  ≈ {plan.evals} GATE evaluations
                  <span className="mt-1 block text-[var(--text-muted)]">or ≈ {plan.decks} flashcard decks</span>
                </p>
                <button
                  type="button"
                  onClick={goApp}
                  className={cn(
                    "mt-6 w-full rounded-full py-2.5 text-sm font-medium transition",
                    plan.highlight
                      ? "bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]"
                      : "border border-[var(--line)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]",
                  )}
                >
                  {user ? "Open wallet" : "Get started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[var(--line)] px-6 py-12 text-center">
          <div className="lyra-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--bg-elevated),var(--accent-soft))]" />
          <div className="relative">
            <p className="text-lg font-medium tracking-tight md:text-xl">
              Sign in with Google, use starter credits, and submit a GATE solution.
            </p>
            <button
              type="button"
              onClick={goApp}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-text)] shadow-[0_12px_28px_var(--ring)] transition hover:bg-[var(--accent-hover)]"
            >
              Start your first evaluation <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-5 md:grid-cols-4">
          <div>
            <Logo subtitle="GATE CS prep" />
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              AI evaluation and revision decks for GATE Computer Science. Prepaid credits, no subscription.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Product</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/evaluation" className="hover:text-[var(--accent)]">
                Answer Evaluation
              </Link>
              <Link href="/flashcards" className="hover:text-[var(--accent)]">
                Flashcards
              </Link>
              <a href="#pricing" className="hover:text-[var(--accent)]">
                Pricing
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Workspace</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/dashboard" className="hover:text-[var(--accent)]">
                Dashboard
              </Link>
              <Link href="/credits" className="hover:text-[var(--accent)]">
                Credits
              </Link>
              <Link href="/login" className="hover:text-[var(--accent)]">
                Sign in
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Legal</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Not affiliated with IITs, IISc, or GATE. Feedback is formative practice only.
            </p>
          </div>
        </div>
        <p className="border-t border-[var(--line)] px-5 py-4 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} {brand.name}
        </p>
      </footer>
    </div>
  );
}
