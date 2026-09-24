"use client";

import { Cpu, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const QUESTION =
  "A process executes for (i = 0; i < n; i++) fork(); The total number of child processes created is?";
const ANSWER =
  "Each fork doubles the process count, so n forks produce 2^n processes in total. Subtract the parent: 2^n − 1 child processes. This assumes fork() never fails.";

const NOTES = [
  { k: "Count", v: "2^n processes" },
  { k: "Parent", v: "subtract one" },
  { k: "Caveat", v: "fork can fail" },
];

const ANSWER_WORDS = ANSWER.trim().split(/\s+/).length;

function wait(ms: number, signal: { cancelled: boolean }, timers: number[]) {
  return new Promise<void>((resolve) => {
    const id = window.setTimeout(() => resolve(), ms);
    timers.push(id);
  }).then(() => {
    if (signal.cancelled) throw new Error("cancelled");
  });
}

async function typeWords(
  text: string,
  set: (value: string) => void,
  delay: number,
  signal: { cancelled: boolean },
  timers: number[],
) {
  const words = text.split(" ");
  for (let i = 1; i <= words.length; i += 1) {
    set(words.slice(0, i).join(" "));
    await wait(delay, signal, timers);
  }
}

export function HeroDemo() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [notes, setNotes] = useState(0);
  const [done, setDone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setQ(QUESTION);
      setA(ANSWER);
      setNotes(NOTES.length);
      setDone(true);
      return;
    }

    const signal = { cancelled: false };
    const timers: number[] = [];

    async function loop() {
      while (!signal.cancelled) {
        setDone(false);
        setScanning(false);
        setNotes(0);
        setQ("");
        setA("");
        await wait(420, signal, timers);
        await typeWords(QUESTION, setQ, 42, signal, timers);
        await wait(260, signal, timers);
        await typeWords(ANSWER, setA, 48, signal, timers);
        setScanning(true);
        await wait(640, signal, timers);
        setScanning(false);
        for (let i = 1; i <= NOTES.length; i += 1) {
          setNotes(i);
          await wait(260, signal, timers);
        }
        setDone(true);
        await wait(2200, signal, timers);
      }
    }

    void loop().catch(() => {
      /* unmounted */
    });

    return () => {
      signal.cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: Math.max(-3.2, Math.min(3.2, py * -5)), y: Math.max(-3.6, Math.min(3.6, px * 6)) });
    setHovering(true);
  }

  function onLeave() {
    setTilt({ x: 0, y: 0 });
    setHovering(false);
  }

  const words = a.trim() ? a.trim().split(/\s+/).length : 0;
  const answerProgress = ANSWER_WORDS === 0 ? 0 : words / ANSWER_WORDS;
  const typingQuestion = q.length > 0 && q.length < QUESTION.length && !scanning && !done;
  const typingAnswer = a.length > 0 && a.length < ANSWER.length && !scanning && !done;

  return (
    <div className="[perspective:980px]">
      <div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[var(--shadow)]",
          "will-change-transform",
          hovering ? "transition-transform duration-150 ease-out" : "transition-transform duration-500 ease-out",
        )}
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
        {scanning && (
          <div className="qubrix-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[var(--accent)]/0 via-[var(--accent)]/18 to-[var(--accent)]/0" />
        )}

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-[11px] font-medium text-[var(--text-muted)]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Cpu size={14} strokeWidth={1.75} />
              </span>
              <span className="truncate">GATE CS · Operating Systems</span>
            </span>
            <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2 py-1 text-[11px] tabular-nums text-[var(--text-muted)]">
              {words}/{ANSWER_WORDS}
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-[var(--bg-muted)]/80 px-3 py-2.5">
            <p className="min-h-[3.25rem] text-sm font-medium leading-relaxed sm:min-h-12">
              {q || "\u00a0"}
              {typingQuestion && <span className="qubrix-caret" />}
            </p>
          </div>

          <div className="relative mt-3 min-h-24 pl-3.5">
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-0 w-0.5 origin-top rounded-full bg-[var(--accent)]/70 transition-transform duration-300 ease-out"
              style={{ transform: `scaleY(${answerProgress})` }}
            />
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {a || "\u00a0"}
              {typingAnswer && <span className="qubrix-caret" />}
            </p>
          </div>

          <ul className="mt-3 flex min-h-8 flex-wrap gap-1.5">
            {NOTES.map((note, index) => {
              const on = index < notes;
              return (
                <li
                  key={note.k}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition-all duration-500",
                    on
                      ? "translate-y-0 border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--text)] opacity-100"
                      : "translate-y-1 border-transparent bg-transparent text-transparent opacity-0",
                  )}
                >
                  <span className="font-semibold text-[var(--accent)]">{note.k}</span>
                  <span className="truncate text-[var(--text-muted)]">{note.v}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={cn(
            "flex items-center justify-between gap-3 border-t border-[var(--accent)]/15 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-soft)_40%,var(--bg-elevated)),var(--accent-soft))] px-4 py-3 transition-all duration-700 sm:px-5",
            done ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
          )}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]">
              <Sparkles size={13} strokeWidth={1.75} />
              Marked
            </p>
            <p className="mt-0.5 text-xs leading-snug text-[var(--text-muted)]">
              Recurrence is right. Name the failed-fork case.
            </p>
          </div>
          <div className="relative grid h-12 w-12 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 h-12 w-12 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="color-mix(in srgb, var(--accent) 18%, transparent)" strokeWidth="2.5" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="94.2"
                strokeDashoffset={done ? 14 : 94.2}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <p className="text-[13px] font-semibold leading-none tracking-tight text-[var(--accent)]">
              8.5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
