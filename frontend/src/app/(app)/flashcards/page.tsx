"use client";

import { ArrowRight, Layers, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, cacheCredits, peekCredits } from "@/lib/api";
import { upsertFlashDeck } from "@/lib/flash-store";
import type { FlashDeck } from "@/lib/flashcards";
import {
  CARD_FORMATS,
  EXAM_WEIGHTS,
  EXTRA_FOCUSES,
  FOCUSES,
  GATE_PAPERS,
  GENERATE_COST,
  PRIMARY_FOCUSES,
  type GateSubject,
} from "@/lib/gate-syllabus";
import { cn } from "@/lib/utils";

const STEPS = [
  "Mapping the GATE syllabus…",
  "Writing atomic cards…",
  "Adding traps and complexity…",
  "Packing your revision deck…",
];

function Toggle({
  on,
  label,
  hint,
  onClick,
}: {
  on: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-2.5 text-left transition",
        on ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]",
      )}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">{hint}</p>
    </button>
  );
}

export default function FlashcardsGeneratePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [paperId, setPaperId] = useState<"CS" | "DA">("CS");
  const paper = GATE_PAPERS.find((p) => p.id === paperId) ?? GATE_PAPERS[0];
  const [subjectId, setSubjectId] = useState(paper.subjects[5]?.id ?? paper.subjects[0].id);
  const subject: GateSubject = paper.subjects.find((s) => s.id === subjectId) ?? paper.subjects[0];
  const [unit, setUnit] = useState(subject.units[1]?.name ?? subject.units[0].name);
  const [customUnit, setCustomUnit] = useState("");
  const [topic, setTopic] = useState(subject.units[1]?.topics[0] ?? "CPU scheduling");
  const [count, setCount] = useState(8);
  const [focus, setFocus] = useState("key_concepts");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [examWeight, setExamWeight] = useState("mixed");
  const [cardFormat, setCardFormat] = useState("qa");
  const [includeComplexity, setIncludeComplexity] = useState(true);
  const [includeTraps, setIncludeTraps] = useState(true);
  const [includeNat, setIncludeNat] = useState(false);
  const [includeMnemonics, setIncludeMnemonics] = useState(false);
  const [includeCompare, setIncludeCompare] = useState(true);
  const [showExtraFocus, setShowExtraFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1400);
    return () => window.clearInterval(id);
  }, [busy]);

  const unitName = customUnit.trim() || unit;
  const suggested = useMemo(() => {
    const current = subject.units.find((u) => u.name === unit);
    return current?.topics ?? subject.units.flatMap((u) => u.topics).slice(0, 10);
  }, [subject, unit]);
  const reviewMins = Math.max(3, Math.round(count * 0.7));
  const credits = typeof user?.credits === "number" ? user.credits : peekCredits();
  const focusMeta = FOCUSES.find((f) => f.id === focus);

  function setPaper(next: "CS" | "DA") {
    const p = GATE_PAPERS.find((x) => x.id === next)!;
    setPaperId(next);
    const first = p.subjects[0];
    setSubjectId(first.id);
    setUnit(first.units[0].name);
    setCustomUnit("");
    setTopic(first.units[0].topics[0] ?? "");
  }

  function pickSubject(next: GateSubject) {
    setSubjectId(next.id);
    const u = next.units[0];
    setUnit(u.name);
    setCustomUnit("");
    setTopic(u.topics[0] ?? "");
  }

  function examWeekPack() {
    const os = GATE_PAPERS[0].subjects.find((s) => s.id === "os") ?? GATE_PAPERS[0].subjects[0];
    setPaperId("CS");
    setSubjectId(os.id);
    setUnit("CPU scheduling");
    setCustomUnit("");
    setTopic("CPU scheduling, page replacement, deadlock, 2PL vs timestamp");
    setCount(15);
    setFocus("common_mistakes");
    setDifficulty("mixed");
    setExamWeight("mixed");
    setCardFormat("compare");
    setIncludeTraps(true);
    setIncludeCompare(true);
    setIncludeNat(true);
    setShowExtraFocus(true);
    toast.message("Exam-week pack loaded");
  }

  async function generate() {
    if (!topic.trim()) {
      toast.error("Add a GATE topic so the cards stay focused.");
      return;
    }
    setBusy(true);
    setStep(0);
    try {
      const deck = await api<FlashDeck>("/api/flashcards/generate", {
        method: "POST",
        timeoutMs: 90_000,
        body: JSON.stringify({
          paper_code: paperId,
          subject_name: subject.name,
          unit_name: unitName,
          topic_name: topic.trim(),
          count,
          focus,
          notes,
          difficulty,
          include_complexity: includeComplexity,
          include_traps: includeTraps,
          include_nat: includeNat,
          include_mnemonics: includeMnemonics,
          include_compare: includeCompare,
          exam_weight: examWeight,
          card_format: cardFormat,
          title: topic.trim(),
        }),
      });
      if (typeof deck.credits_left === "number") cacheCredits(deck.credits_left);
      toast.success(`${deck.card_count} cards ready · ${topic.trim()}`);
      upsertFlashDeck(deck);
      router.push(`/flashcards/${deck.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate cards");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="h-full overflow-y-auto overscroll-contain px-4 pb-16 pt-4 md:px-8 lg:px-10 [scrollbar-gutter:stable]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Revision studio</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">Generate flashcards</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              After generate, you land on a unique deck URL. Flip cards, then tap Got it or Still shaky — Due and Shaky update from that.
            </p>
          </div>
          <button
            type="button"
            onClick={examWeekPack}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium shadow-sm transition hover:border-[var(--accent)]"
          >
            <Layers size={15} className="text-[var(--flash)]" /> Exam-week pack
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {GATE_PAPERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaper(p.id)}
              className={cn(
                "rounded-md border px-3 py-2 text-left",
                paperId === p.id ? "border-transparent bg-[var(--accent)] text-white" : "border-[var(--line)] bg-[var(--bg-elevated)]",
              )}
            >
              <span className="text-sm font-medium">{p.label}</span>
              <span className={cn("ml-2 hidden text-[11px] sm:inline", paperId === p.id ? "text-white/80" : "text-[var(--text-muted)]")}>{p.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid items-start gap-6 pb-8 xl:grid-cols-[1.15fr_0.85fr] xl:gap-8">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Exam & category</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Typical mark share is a recent-paper sketch, not an official weightage.</p>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent)]">{subject.typical}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {paper.subjects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickSubject(item)}
                  className={cn(
                    "rounded-md border px-3 py-3 text-left transition",
                    subject.id === item.id
                      ? "border-transparent bg-[var(--accent)] text-white shadow-[0_10px_24px_var(--ring)]"
                      : "border-[var(--line)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.short}</span>
                    {subject.id === item.id ? (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">Selected</span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">{item.typical}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{item.name}</p>
                  <p className={cn("mt-0.5 text-[11px]", subject.id === item.id ? "text-white/80" : "text-[var(--text-muted)]")}>{item.blurb}</p>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium">Unit</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {subject.units.map((u) => (
                <button
                  key={u.name}
                  type="button"
                  onClick={() => {
                    setUnit(u.name);
                    setCustomUnit("");
                    setTopic(u.topics[0] ?? topic);
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs",
                    !customUnit && unit === u.name ? "border-transparent bg-[var(--accent)] text-white" : "border-[var(--line)] bg-[var(--bg-elevated)]",
                  )}
                >
                  {u.name}
                </button>
              ))}
            </div>
            <input
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Or type your own unit"
              className="mt-3 w-full rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            />

            <label className="mt-5 block text-sm font-medium">
              Topic
              <input
                className="mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Virtual memory & page replacement"
              />
            </label>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Suggested topics</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggested.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    topic === t ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Number of cards</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Selected: {count} flashcards · ~{reviewMins} min to review · {GENERATE_COST} credits
            </p>
            <div className="mt-3 flex gap-2">
              {[5, 8, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={cn(
                    "h-10 w-10 rounded-md text-sm font-medium transition",
                    count === n ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-muted)] hover:bg-[var(--accent-soft)]",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium">Focus</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PRIMARY_FOCUSES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFocus(item.id)}
                  className={cn(
                    "rounded-md border p-3 text-left",
                    focus === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]",
                  )}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.hint}</p>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowExtraFocus((v) => !v)} className="mt-2 text-xs text-[var(--accent)]">
              {showExtraFocus ? "Hide extra GATE modes" : "More GATE modes (traps, formulas, checks)"}
            </button>
            {showExtraFocus ? (
              <div className="mt-2 grid gap-2">
                {EXTRA_FOCUSES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocus(item.id)}
                    className={cn(
                      "rounded-md border p-3 text-left",
                      focus === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]",
                    )}
                  >
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.hint}</p>
                  </button>
                ))}
              </div>
            ) : null}

            <p className="mt-6 text-sm font-medium">Exam flavour</p>
            <div className="mt-2 grid gap-2">
              {EXAM_WEIGHTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExamWeight(item.id)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left",
                    examWeight === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]",
                  )}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{item.hint}</p>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium">Card format</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CARD_FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCardFormat(item.id)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left",
                    cardFormat === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]",
                  )}
                >
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{item.hint}</p>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium">Difficulty mix</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["mixed", "GATE mix"],
                ["easy", "Warm-up"],
                ["medium", "Core"],
                ["hard", "Stretch"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDifficulty(id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium",
                    difficulty === id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-muted)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium">Make the deck GATE-harder</p>
            <div className="mt-2 grid gap-2">
              <Toggle on={includeComplexity} label="Time / space complexity" hint="When the result is standard, put Big-O on the back." onClick={() => setIncludeComplexity((v) => !v)} />
              <Toggle on={includeTraps} label="Common GATE traps" hint="Lookalike terms, off-by-one, wrong model of computation." onClick={() => setIncludeTraps((v) => !v)} />
              <Toggle on={includeCompare} label="Compare / contrast" hint="Paging vs segmentation, TCP vs UDP, 2PL vs timestamp." onClick={() => setIncludeCompare((v) => !v)} />
              <Toggle on={includeNat} label="NAT-style numericals" hint="Practice calculations with working. Not official NAT items." onClick={() => setIncludeNat((v) => !v)} />
              <Toggle on={includeMnemonics} label="Memory hooks" hint="Short mnemonics only when they actually help." onClick={() => setIncludeMnemonics((v) => !v)} />
            </div>

            <p className="mt-6 text-sm font-medium">
              Context <span className="font-normal text-[var(--text-muted)]">optional</span>
            </p>
            <Textarea
              className="mt-2 min-h-24"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste class notes, a theorem, or a worked example."
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex h-14 items-center gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 md:px-8">
        <Button className="mx-auto h-9 w-full max-w-3xl text-sm sm:mx-0 sm:flex-1" disabled={busy} onClick={() => void generate()}>
          {busy ? (
            <>
              <Loader size="sm" /> {STEPS[step]}
            </>
          ) : (
            <>
              <WandSparkles size={15} /> Generate {count} flashcards <ArrowRight size={15} />
            </>
          )}
        </Button>
        <p className="hidden shrink-0 text-[11px] text-[var(--text-muted)] sm:block">
          {GENERATE_COST} cr{credits != null ? ` · ${credits} left` : ""} · ~{reviewMins} min
        </p>
      </div>
    </div>
  );
}
