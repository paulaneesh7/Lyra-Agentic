"use client";

import { useEffect, useState } from "react";

const QUESTION =
  "A process executes for (i = 0; i < n; i++) fork(); The total number of child processes created is?";
const ANSWER =
  "Each fork doubles the process count, so n forks produce 2^n processes in total. Subtract the parent: 2^n − 1 child processes. This assumes fork() never fails.";

export function HeroDemo() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let j = 0;
    let phase: "q" | "a" | "done" = "q";
    const timer = window.setInterval(() => {
      if (phase === "q") {
        i += 1;
        setQ(QUESTION.slice(0, i));
        if (i >= QUESTION.length) phase = "a";
        return;
      }
      if (phase === "a") {
        j += 2;
        setA(ANSWER.slice(0, j));
        if (j >= ANSWER.length) {
          phase = "done";
          setDone(true);
          window.clearInterval(timer);
        }
      }
    }, 28);
    return () => window.clearInterval(timer);
  }, []);

  const words = a.trim() ? a.trim().split(/\s+/).length : 0;

  return (
    <div className="relative rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
        <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 font-medium text-[var(--accent)]">
          GATE CS · Operating Systems
        </span>
        <span>
          {words}/{ANSWER.trim().split(/\s+/).length}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-sm font-medium leading-relaxed">{q || " "}</p>
      <p className="mt-3 min-h-24 text-sm leading-relaxed text-[var(--text-muted)]">
        {a}
        {!done && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-[var(--accent)] align-middle" />}
      </p>
      <div
        className={`mt-4 flex items-end justify-between gap-3 border-t border-[var(--line)] pt-3 transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`}
      >
        <div>
          <p className="text-xs font-medium text-[var(--accent)]">Evaluation complete</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Clear recurrence — mention failed-fork assumption</p>
        </div>
        <p className="text-2xl font-semibold tracking-tight">
          8.5<span className="text-sm font-medium text-[var(--text-muted)]">/10</span>
        </p>
      </div>
    </div>
  );
}
