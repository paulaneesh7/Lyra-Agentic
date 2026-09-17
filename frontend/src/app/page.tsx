"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MessageCircle, Minus, Sparkles, Layers } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { HeroDemo } from "@/components/landing/hero-demo";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { brand } from "@/lib/brand";

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

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  function goApp() {
    router.push(user ? "/dashboard" : "/login");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo subtitle="Practice · Evaluate · Qualify" />
          <nav className="hidden items-center gap-7 text-sm text-[var(--text-muted)] md:flex">
            <a href="#output" className="hover:text-[var(--text)]">
              Product
            </a>
            <a href="#how" className="hover:text-[var(--text)]">
              How it works
            </a>
            <a href="#pricing" className="hover:text-[var(--text)]">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] py-1 pr-3 pl-1 sm:flex"
              >
                <UserAvatar name={user.full_name} src={user.avatar_url} size={28} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{user.full_name}</span>
                  <span className="block truncate text-[10px] text-[var(--text-muted)]">{user.email}</span>
                </span>
              </Link>
            ) : (
              <Link href="/login" className="hidden text-sm text-[var(--text-muted)] sm:inline">
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={goApp}
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="lyra-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
              <Sparkles size={14} />
              Submit a solution. Get GATE-aware feedback.
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Practice smarter.
              <br />
              Write clearer
              <br />
              <span className="text-[var(--accent)]">GATE answers.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
              Type or photograph a GATE CS solution. Lyra scores the approach, flags missing cases, and shows what a high-scoring answer usually includes — in a few minutes, not a few days.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={goApp}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
              >
                Get started <ArrowRight size={16} />
              </button>
              <a href="#output" className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-5 py-2.5 text-sm">
                See a sample report
              </a>
            </div>
          </div>
          <HeroDemo />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-wrap gap-10 px-5 pb-10 text-left">
          {[
            ["< 3 min", "Evaluation time"],
            ["6", "Rubric criteria"],
            ["24/7", "Practice feedback"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border-y border-[var(--line)] py-3">
        <div className="lyra-marquee flex w-max gap-2">
          {[...SUBJECTS, ...SUBJECTS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <section id="output" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">The output</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">See what to fix, not just a score.</h2>
          <div className="mt-8 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">GATE CS · Operating Systems</p>
                <p className="text-xs text-[var(--text-muted)]">NAT · fork() process count</p>
              </div>
              <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-sm font-semibold text-[var(--accent)]">
                8.5/10
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {RUBRIC.map(([label, score]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{label}</span>
                    <span className="text-[var(--text-muted)]">{score}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-md bg-[var(--bg-muted)]">
                    <div className="h-full rounded-md bg-[var(--accent)]" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="rounded-md bg-[var(--bg)] px-3 py-2">Clear 2ⁿ recurrence with the parent subtracted.</li>
              <li className="rounded-md bg-[var(--bg)] px-3 py-2 text-[var(--text-muted)]">
                Add the failed-fork case — GATE often awards that extra step.
              </li>
            </ul>
          </div>
        </div>
        <div className="space-y-3 md:pt-16">
          <p className="text-sm text-[var(--text-muted)]">
            Six GATE-style checks with comments and an overall mark out of 10.
          </p>
          {[
            [Sparkles, "GATE CS rubric", "Approach, correctness, completeness, notation, complexity, and edge cases."],
            [MessageCircle, "Follow-up chat", "Ask why a mark was lost or how to tighten a derivation."],
            [Layers, "Flashcards", "Topic decks from the GATE CS syllabus. Review is free."],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
              <Icon className="text-[var(--accent)]" size={18} />
              <h3 className="mt-3 font-medium">{title as string}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{copy as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-[var(--line)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Upload. Evaluate.
              <br />
              Improve.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-[var(--text-muted)]">
              Bring your own GATE questions — previous papers, coaching sheets, or a problem you just attempted. No locked question bank required.
            </p>
          </div>
          <ol className="space-y-6">
            {[
              ["Add the question", "Paste it or photograph the paper — we extract the text."],
              ["Add your solution", "Type the steps or upload up to four sheets."],
              ["Get scored feedback", "Rubric marks, gaps, and a cleaner approach for next time."],
            ].map(([title, copy], i) => (
              <li key={title} className="flex gap-4">
                <span className="text-sm font-semibold text-[var(--accent)]">0{i + 1}</span>
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
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Comparison</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            More than a mark. A clearer path to GATE CS.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)]">
            Instant, structured feedback so you can see where an answer stands against a high-scoring GATE pattern — not a vague “good attempt”.
          </p>
          <div className="mt-8 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg-elevated)]">
            <table className="w-full text-sm">
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
                      {lyra === true ? <Check size={16} className="text-[var(--accent)]" /> : <span>{lyra as string}</span>}
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

      <section id="pricing" className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Prepaid packs. No subscription.</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Buy credits once. Spend them on evaluations, flashcard generation, or both. Reviewing cards is free.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-md border p-5 ${plan.highlight ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]"}`}
              >
                {plan.badge && (
                  <p className="mb-3 text-center text-[11px] font-medium text-[var(--accent)]">{plan.badge}</p>
                )}
                <p className="text-center text-sm text-[var(--text-muted)]">{plan.name}</p>
                <p className="mt-2 text-center text-3xl font-semibold">₹{plan.price}</p>
                <p className="mt-1 text-center text-xs text-[var(--text-muted)]">{plan.credits} credits</p>
                <p className="mt-6 text-center text-sm">
                  ≈ {plan.evals} GATE evaluations
                  <span className="mt-1 block text-[var(--text-muted)]">or ≈ {plan.decks} flashcard decks</span>
                </p>
                <button
                  type="button"
                  onClick={goApp}
                  className={`mt-6 w-full rounded-md py-2.5 text-sm font-medium ${plan.highlight ? "bg-[var(--accent)] text-white" : "border border-[var(--line)] bg-[var(--bg-elevated)]"}`}
                >
                  {user ? "Open wallet" : "Get started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="mx-auto max-w-6xl rounded-md bg-[linear-gradient(180deg,var(--bg-elevated),var(--accent-soft))] px-6 py-12 text-center">
          <p className="text-lg font-medium">Sign in with Google, use starter credits, and submit a GATE solution.</p>
          <button
            type="button"
            onClick={goApp}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
          >
            Start your first evaluation <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <p className="mx-auto max-w-6xl px-5 py-4 text-center text-xs text-[var(--text-muted)]">
          Not affiliated with IITs, IISc, GATE, or any organising body. Feedback is for practice only.
        </p>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-4">
          <div>
            <Logo subtitle="GATE CS prep" />
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              AI evaluation and revision decks for GATE Computer Science. Prepaid credits, no subscription.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Product</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/evaluation">Answer Evaluation</Link>
              <Link href="/flashcards">Flashcards</Link>
              <a href="#pricing">Pricing</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Workspace</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/credits">Credits</Link>
              <Link href="/login">Sign in</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Legal</p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Demo AI in local mode. Do not treat scores as official GATE marks.
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
