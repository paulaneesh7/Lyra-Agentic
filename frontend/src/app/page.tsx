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
import { GoogleButton } from "@/components/google-button";
import { HeroDemo } from "@/components/landing/hero-demo";
import { Logo } from "@/components/logo";
import { ScrollToTop } from "@/components/scroll-to-top";
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

const FEATURES = [
  [Sparkles, "GATE CS rubric", "Approach, correctness, completeness, notation, complexity, and edge cases — scored like a serious practice review.", "accent"],
  [MessageCircle, "Follow-up chat", "Ask why a mark was lost or how to tighten a derivation without starting from scratch.", "accent"],
  [Layers, "Flashcards", "Topic decks from the GATE CS syllabus. Generation uses credits; reviewing cards is free.", "flash"],
] as const;

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
          <Logo hideSubtitleOnMobile />
          <nav className="hidden items-center gap-1 text-sm text-[var(--text-muted)] md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 transition-colors duration-200 hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
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
              <GoogleButton
                variant="header"
                label={
                  <>
                    <span className="sm:hidden">Sign In</span>
                    <span className="hidden sm:inline">Continue with Google</span>
                  </>
                }
              />
            )}
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

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
            <Logo />
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
                className="block rounded-xl px-3 py-3.5 text-[15px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-muted)]"
              >
                {item.label}
              </a>
            ))}
            {user ? (
              <button
                type="button"
                onClick={goApp}
                className="mt-3 mb-1 w-full rounded-md bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-text)] shadow-[0_10px_24px_var(--ring)]"
              >
                Open workspace
              </button>
            ) : null}
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="lyra-grid pointer-events-none absolute inset-0" />
        <div className="lyra-orb pointer-events-none absolute -top-28 right-[-5rem] h-72 w-72 rounded-full bg-[var(--accent)]/16 blur-3xl" />
        <div className="lyra-orb-2 pointer-events-none absolute top-48 left-[-6rem] h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <p
          aria-hidden
          className="pointer-events-none absolute -right-4 top-24 select-none text-[7.5rem] font-semibold leading-none tracking-tighter text-[var(--text)]/[0.035] sm:text-[10rem] md:right-8 md:top-16 md:text-[12rem]"
        >
          GATE
        </p>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-5 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-24">
          <div>
            <p className="lyra-rise text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {brand.short} · GATE CS
            </p>
            <h1 className="lyra-rise lyra-rise-1 mt-4 max-w-xl text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-[3.15rem]">
              Practice smarter.
              <br />
              Write clearer{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_65%,#c4a8f0)] bg-clip-text text-transparent">
                GATE
              </span>{" "}
              answers.
            </h1>
            <p className="lyra-rise lyra-rise-2 mt-5 max-w-md text-[15px] leading-relaxed text-[var(--text-muted)]">
              Type or photograph a GATE CS solution. {brand.short} scores the approach, flags missing cases, and shows
              what a high-scoring answer usually includes — in minutes, not days.
            </p>
            <div className="lyra-rise lyra-rise-3 mt-8 flex w-full flex-nowrap items-stretch gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={goApp}
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--accent)] px-3 py-2.5 text-[13px] font-medium text-[var(--accent-text)] shadow-[0_12px_32px_var(--ring)] transition hover:bg-[var(--accent-hover)] hover:shadow-[0_14px_36px_var(--ring)] sm:flex-none sm:gap-2 sm:px-6 sm:text-sm"
              >
                Get started <ArrowRight size={15} className="shrink-0" />
              </button>
              <a
                href="#product"
                className="inline-flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-[var(--line)] bg-[var(--bg-elevated)]/80 px-3 py-2.5 text-center text-[13px] backdrop-blur-sm transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-muted)] sm:flex-none sm:px-6 sm:text-sm"
              >
                <span className="sm:hidden">Sample report</span>
                <span className="hidden sm:inline">See a sample report</span>
              </a>
            </div>
            <div className="lyra-rise lyra-rise-4 mt-12 grid w-full grid-cols-3 gap-2 border-t border-[var(--line)] pt-6 text-sm sm:flex sm:gap-x-8 sm:gap-y-4">
              {[
                ["< 3 min", "per evaluation"],
                ["6 criteria", "GATE-style rubric"],
                ["24/7", "practice feedback"],
              ].map(([value, label]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[13px] font-semibold tracking-tight sm:text-sm">{value}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lyra-rise lyra-rise-3 relative mx-auto w-full max-w-md md:mx-0 md:max-w-none">
            <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[var(--accent)]/8 blur-3xl" />
            {/* Orbit rings */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2">
              <div className="lyra-orbit absolute inset-0 rounded-full border border-dashed border-[var(--line)] opacity-70" />
              <div className="lyra-orbit-rev absolute inset-[8%] rounded-full border border-[var(--line)]/60 opacity-50" />
              <span className="absolute left-[8%] top-[18%] h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--ring)]" />
              <span className="absolute bottom-[22%] right-[10%] h-1.5 w-1.5 rounded-full bg-[var(--accent)]/70" />
            </div>
            <div className="lyra-grid-fine pointer-events-none absolute -inset-4 rounded-3xl opacity-80" />
            <div className="relative">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Subject marquee */}
      <div className="relative overflow-hidden border-y border-[var(--line)] py-3.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent" />
        <div className="lyra-marquee flex w-max gap-2">
          {[...SUBJECTS, ...SUBJECTS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Product — bento */}
      <section id="product" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-5 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">The output</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            See what to fix, not just a score.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] md:text-[15px]">
            Six GATE-style checks with comments and an overall mark out of 10 — so the next attempt is sharper, not
            guesswork.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-12">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow)] md:col-span-7 md:p-6">
            <div className="lyra-grid pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">GATE CS · Operating Systems</p>
                  <p className="text-xs text-[var(--text-muted)]">NAT · fork() process count</p>
                </div>
                <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-sm font-semibold tabular-nums text-[var(--accent)]">
                  8.5/10
                </span>
              </div>
              <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
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
              <ul className="mt-6 space-y-2 text-sm">
                <li className="rounded-xl border border-[var(--line)]/80 bg-[var(--bg)]/80 px-3.5 py-2.5">
                  Clear 2ⁿ recurrence with the parent subtracted.
                </li>
                <li className="rounded-xl border border-[var(--line)]/80 bg-[var(--bg)]/80 px-3.5 py-2.5 text-[var(--text-muted)]">
                  Add the failed-fork case — GATE often awards that extra step.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:col-span-5">
            {FEATURES.map(([Icon, title, copy, tone]) => (
              <div
                key={title}
                className="group flex-1 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:shadow-[var(--shadow)]"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition group-hover:scale-105",
                    tone === "flash"
                      ? "bg-[var(--flash-soft)] text-[var(--flash)]"
                      : "bg-[var(--accent-soft)] text-[var(--accent)]",
                  )}
                >
                  <Icon size={17} />
                </span>
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative border-t border-[var(--line)]">
        <div className="lyra-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-5 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Upload. Evaluate.
              <br />
              Improve.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              Bring your own GATE questions — previous papers, coaching sheets, or a problem you just attempted. No
              locked question bank required.
            </p>
            <button
              type="button"
              onClick={goApp}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition hover:gap-3"
            >
              Try it free <ArrowRight size={15} />
            </button>
          </div>
          <ol className="relative space-y-0">
            <div
              aria-hidden
              className="absolute bottom-6 left-[1.35rem] top-6 w-px bg-gradient-to-b from-[var(--accent)]/50 via-[var(--line)] to-transparent"
            />
            {[
              ["Add the question", "Paste it or photograph the paper — we extract the text."],
              ["Add your solution", "Type the steps or upload up to four sheets."],
              ["Get scored feedback", "Rubric marks, gaps, and a cleaner approach for next time."],
            ].map(([title, copy], i) => (
              <li key={title} className="relative flex gap-5 py-4 first:pt-0 last:pb-0">
                <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] text-xs font-semibold tabular-nums text-[var(--accent)] shadow-[var(--shadow)]">
                  0{i + 1}
                </span>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/90 px-4 py-3.5 backdrop-blur-sm">
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-5 md:py-24">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Comparison</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              More than a mark. A clearer path to GATE CS.
            </h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Instant, structured feedback so you can see where an answer stands against a high-scoring GATE pattern —
              not a vague “good attempt”.
            </p>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-[var(--bg-muted)]/60 text-left text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3.5 font-medium">What you get</th>
                  <th className="px-4 py-3.5 font-medium text-[var(--accent)]">{brand.short}</th>
                  <th className="px-4 py-3.5 font-medium">Typical review</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, lyra, other]) => (
                  <tr key={String(label)} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3.5">{label as string}</td>
                    <td className="px-4 py-3.5">
                      {lyra === true ? (
                        <Check size={16} className="text-[var(--accent)]" />
                      ) : (
                        <span className="font-medium">{lyra as string}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">
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

      {/* Pricing */}
      <section id="pricing" className="relative border-t border-[var(--line)]">
        <div className="lyra-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-5 md:py-24">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Prepaid packs. No subscription.</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Buy credits once. Spend them on evaluations, flashcard generation, or both. Reviewing cards is free.
            </p>
          </div>
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
                    "mt-6 w-full rounded-md py-2.5 text-sm font-medium transition",
                    plan.highlight
                      ? "bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]"
                      : "border border-[var(--line)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:bg-[var(--bg-muted)]",
                  )}
                >
                  {user ? "Open wallet" : "Get started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-10 sm:px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--line)] px-6 py-14 text-center sm:px-10">
          <div className="lyra-grid pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--bg-elevated)_0%,var(--accent-soft)_55%,var(--bg-elevated)_100%)] opacity-90" />
          <div className="lyra-orb pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--accent)]/20 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{brand.short}</p>
            <p className="mx-auto mt-3 max-w-lg text-xl font-semibold tracking-tight md:text-2xl">
              Sign in with Google, use starter credits, and submit a GATE solution.
            </p>
            <button
              type="button"
              onClick={goApp}
              className="mt-7 inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent-text)] shadow-[0_12px_28px_var(--ring)] transition hover:bg-[var(--accent-hover)]"
            >
              Start your first evaluation <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-5 md:grid-cols-4">
          <div>
            <Logo subtitle={brand.line} />
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              AI evaluation and revision decks for GATE Computer Science. Prepaid credits, no subscription.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Product</p>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <Link href="/evaluation" className="rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-muted)]">
                Answer Evaluation
              </Link>
              <Link href="/flashcards" className="rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-muted)]">
                Flashcards
              </Link>
              <a href="#pricing" className="rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-muted)]">
                Pricing
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Workspace</p>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <Link href="/dashboard" className="rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-muted)]">
                Dashboard
              </Link>
              <Link href="/credits" className="rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-muted)]">
                Credits
              </Link>
              <Link href="/login" className="rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--bg-muted)]">
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

      <ScrollToTop />
    </div>
  );
}
