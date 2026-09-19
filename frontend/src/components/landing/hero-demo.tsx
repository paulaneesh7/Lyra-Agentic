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
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let i = 0;
    let j = 0;
    let phase: "q" | "a" | "done" = "q";
    let finishTimer: number | undefined;
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
          window.clearInterval(timer);
          setScanning(true);
          finishTimer = window.setTimeout(() => {
            setScanning(false);
            setDone(true);
          }, 1200);
        }
      }
    }, 28);
    return () => {
      window.clearInterval(timer);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, []);

  const words = a.trim() ? a.trim().split(/\s+/).length : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow)] sm:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
      {scanning && (
        <div className="lyra-scan pointer-events-none absolute inset-x-4 top-0 h-16 bg-gradient-to-b from-[var(--accent)]/0 via-[var(--accent)]/18 to-[var(--accent)]/0" />
      )}
      <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
        <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent)]">
          GATE CS · Operating Systems
        </span>
        <span className="tabular-nums">
          {words}/{ANSWER.trim().split(/\s+/).length}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-sm font-medium leading-relaxed">{q || "\u00a0"}</p>
      <p className="mt-3 min-h-24 text-sm leading-relaxed text-[var(--text-muted)]">
        {a}
        {!done && !scanning && (
          <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-[var(--accent)] align-middle" />
        )}
      </p>
      <div
        className={`mt-4 flex items-end justify-between gap-3 border-t border-[var(--line)] pt-3 transition-all duration-700 ${done ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        <div>
          <p className="text-xs font-medium text-[var(--accent)]">Evaluation complete</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Clear recurrence — mention failed-fork assumption
          </p>
        </div>
        <p className="text-2xl font-semibold tracking-tight">
          8.5<span className="text-sm font-medium text-[var(--text-muted)]">/10</span>
        </p>
      </div>
    </div>
  );
}
