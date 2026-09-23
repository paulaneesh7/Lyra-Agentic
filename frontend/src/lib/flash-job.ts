"use client";

import { toast } from "sonner";
import { api, cacheCredits } from "@/lib/api";
import { upsertFlashDeck } from "@/lib/flash-store";
import type { FlashDeck } from "@/lib/flashcards";

export const GENERATE_STEPS = [
  "Mapping the GATE syllabus…",
  "Writing atomic cards…",
  "Adding traps and complexity…",
  "Packing your revision deck…",
] as const;

export type FlashGenerateInput = {
  paper_code: string;
  subject_name: string;
  unit_name: string;
  topic_name: string;
  count: number;
  focus: string;
  notes: string;
  difficulty: string;
  include_complexity: boolean;
  include_traps: boolean;
  include_nat: boolean;
  include_mnemonics: boolean;
  include_compare: boolean;
  exam_weight: string;
  card_format: string;
  title: string;
};

export type FlashJob =
  | { status: "idle" }
  | { status: "running"; step: number; topic: string }
  | { status: "ready"; deck: FlashDeck };

const IDLE: FlashJob = { status: "idle" };

let job: FlashJob = IDLE;
let timer: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function stopTimer() {
  if (timer != null) {
    window.clearInterval(timer);
    timer = null;
  }
}

/** Lives outside the page so leaving Flashcards does not drop an in-flight deck. */
export function getFlashJob() {
  return job;
}

export function getFlashJobServer() {
  return IDLE;
}

export function subscribeFlashJob(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function flashJobLabel(current: FlashJob = job) {
  if (current.status === "running") return GENERATE_STEPS[current.step] ?? GENERATE_STEPS[0];
  if (current.status === "ready") {
    const count = current.deck.card_count;
    return `${count} card${count === 1 ? "" : "s"} ready`;
  }
  return "";
}

export function startFlashJob(input: FlashGenerateInput) {
  if (job.status === "running") return false;
  stopTimer();
  job = { status: "running", step: 0, topic: input.topic_name };
  emit();
  timer = window.setInterval(() => {
    if (job.status !== "running") return;
    job = { status: "running", step: (job.step + 1) % GENERATE_STEPS.length, topic: job.topic };
    emit();
  }, 1400);
  void runFlashJob(input);
  return true;
}

async function runFlashJob(input: FlashGenerateInput) {
  const topic = input.topic_name;
  try {
    const deck = await api<FlashDeck>("/api/flashcards/generate", {
      method: "POST",
      timeoutMs: 90_000,
      body: JSON.stringify(input),
    });
    if (job.status !== "running" || job.topic !== topic) return;
    if (typeof deck.credits_left === "number") cacheCredits(deck.credits_left);
    upsertFlashDeck(deck);
    stopTimer();
    job = { status: "ready", deck };
    emit();
  } catch (e) {
    if (job.status !== "running" || job.topic !== topic) return;
    stopTimer();
    job = IDLE;
    emit();
    toast.error(e instanceof Error ? e.message : "Could not generate cards");
  }
}

export function takeReadyDeck() {
  if (job.status !== "ready") return null;
  const deck = job.deck;
  job = IDLE;
  emit();
  return deck;
}
