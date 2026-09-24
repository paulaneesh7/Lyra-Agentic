"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "read", label: "Reading the argument", hint: "Parsing your write-up against the question." },
  { id: "map", label: "Mapping GATE concepts", hint: "Checking syllabus language, not an official key." },
  { id: "rubric", label: "Scoring four axes", hint: "Correctness · approach · reasoning · efficiency." },
  { id: "write", label: "Drafting the correction", hint: "Building a tighter answer-sheet version." },
];

const NODES = [
  { label: "Correct", x: "50%", y: "8%" },
  { label: "Approach", x: "92%", y: "50%" },
  { label: "Reason", x: "50%", y: "92%" },
  { label: "Efficient", x: "8%", y: "50%" },
];

export function ScoringStage({ active, subject }: { active: boolean; subject?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-[6px]">
      <div className="relative flex w-full max-w-md flex-col items-center px-6">
        <div className="relative h-56 w-56">
          <div className="absolute inset-6 rounded-full border border-[var(--line)]" />
          <div className="qubrix-orbit absolute inset-0">
            <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_16px_var(--accent)]" />
          </div>
          <div className="qubrix-orbit-rev absolute inset-4">
            <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--accent)]/70" />
          </div>
          <div className="absolute inset-10 overflow-hidden rounded-full border border-[var(--accent)]/30 bg-[var(--bg-elevated)]">
            <div className="qubrix-scan absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[var(--accent)]/20 to-transparent" />
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Qubrix</p>
                <p className="mt-1 text-sm font-medium">Formative score</p>
              </div>
            </div>
          </div>
          {NODES.map((node, index) => (
            <span
              key={node.label}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                index === step
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text-muted)]",
              )}
              style={{ left: node.x, top: node.y }}
            >
              {node.label}
            </span>
          ))}
        </div>
        <p className="mt-6 text-lg font-semibold tracking-tight">{STEPS[step].label}</p>
        <p className="mt-1 text-center text-sm text-[var(--text-muted)]">{STEPS[step].hint}</p>
        {subject ? (
          <p className="mt-3 rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
            {subject} · not an official GATE mark
          </p>
        ) : null}
        <ol className="mt-6 flex w-full gap-1.5">
          {STEPS.map((item, index) => (
            <li key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <span
                className={cn(
                  "block h-full rounded-full bg-[var(--accent)] transition-all duration-500",
                  index < step ? "w-full" : index === step ? "w-2/3" : "w-0",
                )}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
