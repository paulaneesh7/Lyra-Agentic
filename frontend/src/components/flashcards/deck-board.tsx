"use client";

import { Bookmark, Check, Clock3, Copy, Download, Maximize2, Pencil, Pin, Save, Shuffle, Sparkles, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { applyRating } from "@/lib/flash-store";
import { PASTELS, type FlashCard, type FlashDeck } from "@/lib/flashcards";
import { cn } from "@/lib/utils";

export function DeckBoard({
  deck,
  onDeck,
  onDelete,
  pinned,
  onPin,
}: {
  deck: FlashDeck;
  onDeck: (deck: FlashDeck) => void;
  onDelete: () => void;
  pinned: boolean;
  onPin: () => void;
}) {
  const router = useRouter();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [overlay, setOverlay] = useState<{ id: string; mode: "view" | "edit" } | null>(null);
  const [draft, setDraft] = useState({ front: "", back: "", explanation: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "due" | "bookmarked" | "shaky">("all");

  const studyCards = useMemo(() => {
    if (filter === "due") return deck.cards.filter((c) => c.status === "due");
    if (filter === "bookmarked") return deck.cards.filter((c) => c.bookmarked);
    if (filter === "shaky") return deck.cards.filter((c) => c.marked_difficult);
    return deck.cards;
  }, [deck.cards, filter]);

  const overlayIndex = overlay ? studyCards.findIndex((c) => c.id === overlay.id) : -1;
  const card = overlayIndex >= 0 ? studyCards[overlayIndex] : null;
  const known = deck.known_count ?? deck.cards.filter((c) => c.known).length;
  const pct = Math.round((100 * known) / Math.max(1, deck.card_count));

  function patchCard(updated: FlashCard) {
    const cards = deck.cards.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
    const knownCount = cards.filter((c) => c.known).length;
    const dueCount = cards.filter((c) => c.status === "due").length;
    const shakyCount = cards.filter((c) => c.marked_difficult).length;
    onDeck({
      ...deck,
      cards,
      known_count: knownCount,
      due_count: dueCount,
      shaky_count: shakyCount,
    });
  }

  function toggleFlip(id: string) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openCard(item: FlashCard, mode: "view" | "edit") {
    setOverlay({ id: item.id, mode });
    setDraft({ front: item.front, back: item.back, explanation: item.explanation || "" });
    if (mode === "view") setFlipped((prev) => ({ ...prev, [item.id]: Boolean(prev[item.id]) }));
  }

  function closeOverlay() {
    setOverlay(null);
  }

  async function flag(item: FlashCard, partial: Partial<Pick<FlashCard, "bookmarked" | "known" | "marked_difficult">>) {
    patchCard({ ...item, ...partial });
    try {
      const updated = await api<FlashCard>(`/api/flashcards/${item.id}/flags`, {
        method: "POST",
        body: JSON.stringify(partial),
      });
      patchCard(updated);
    } catch (e) {
      patchCard(item);
      toast.error(e instanceof Error ? e.message : "Could not update card");
    }
  }

  async function rate(item: FlashCard, rating: "again" | "hard" | "good" | "easy") {
    patchCard(applyRating(item, rating));
    try {
      const updated = await api<FlashCard>(`/api/flashcards/${item.id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      });
      patchCard(updated);
    } catch (e) {
      patchCard(item);
      toast.error(e instanceof Error ? e.message : "Could not save review");
    }
  }

  async function saveEdit() {
    if (!card) return;
    if (!draft.front.trim() || !draft.back.trim()) {
      toast.error("Question and answer both need text.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api<FlashCard>(`/api/flashcards/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          front: draft.front.trim(),
          back: draft.back.trim(),
          explanation: draft.explanation.trim(),
        }),
      });
      patchCard(updated);
      setOverlay({ id: card.id, mode: "view" });
      toast.success("Card updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save card");
    } finally {
      setSaving(false);
    }
  }

  async function copyCard(item: FlashCard) {
    await navigator.clipboard.writeText(`${item.front}\n\n${item.back}${item.explanation ? `\n\n${item.explanation}` : ""}`);
    toast.success("Card copied");
  }

  function exportDeck() {
    const lines = [
      `# ${deck.title}`,
      `GATE ${deck.paper || "CS"} · ${deck.subject || ""} · ${deck.unit || ""}`,
      "",
      ...deck.cards.flatMap((c, i) => [`## ${i + 1}. ${c.front}`, "", c.back, c.explanation ? `_Why it matters:_ ${c.explanation}` : "", ""]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/\s+/g, "-").toLowerCase()}-gate-flashcards.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function shuffle() {
    const cards = [...deck.cards].sort(() => Math.random() - 0.5);
    onDeck({ ...deck, cards });
    setFlipped({});
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!overlay) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverlay();
      }
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleFlip(overlay.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  useEffect(() => {
    if (!overlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlay]);

  const emptyCopy =
    filter === "due"
      ? "Nothing due. Flip a card and tap Got it — it leaves Due until the next review."
      : filter === "shaky"
        ? "Nothing marked shaky. Flip a card and tap Still shaky to park it here."
        : filter === "bookmarked"
          ? "No bookmarks yet. Zoom a card and bookmark it."
          : "No cards in this deck.";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span>Deck</span>
            <span>·</span>
            <span>GATE {deck.paper || "CS"}</span>
            {deck.subject ? (
              <>
                <span>·</span>
                <span>{deck.subject}</span>
              </>
            ) : null}
            <span>·</span>
            <span>{deck.card_count} cards</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{deck.title}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {deck.unit ? `${deck.unit} · ` : ""}
            {known}/{deck.card_count} known ({pct}%)
            {deck.due_count ? ` · ${deck.due_count} due` : ""}
          </p>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[var(--text-muted)]">
            New cards start in Due. Flip, then Got it (leaves Due, counts as known) or Still shaky (stays in Shaky for extra revision).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] lg:block">
            Tap to flip · {studyCards.length} cards
          </p>
          <Button variant="secondary" onClick={shuffle}>
            <Shuffle size={15} /> Shuffle
          </Button>
          <Button variant="secondary" onClick={exportDeck}>
            <Download size={15} /> Export
          </Button>
          <Button variant="ghost" onClick={onPin} aria-label="Pin deck">
            <Pin size={15} className={pinned ? "fill-[var(--accent)] text-[var(--accent)]" : ""} />
          </Button>
          <Button variant="ghost" onClick={onDelete} aria-label="Delete deck">
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All", deck.card_count],
            ["due", "Due", deck.due_count ?? 0],
            ["bookmarked", "Bookmarked", deck.bookmarked_count ?? 0],
            ["shaky", "Shaky", deck.shaky_count ?? 0],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
              filter === id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-muted)]",
            )}
          >
            {id === "due" ? <Clock3 size={12} /> : null}
            {id === "bookmarked" ? <Bookmark size={12} /> : null}
            {id === "shaky" ? <Star size={12} /> : null}
            {label}
            <span className="tabular-nums opacity-80">{n}</span>
          </button>
        ))}
        <button type="button" onClick={() => router.push("/flashcards")} className="ml-auto inline-flex items-center gap-1.5 text-sm text-[var(--accent)]">
          <Sparkles size={14} /> New deck
        </button>
      </div>

      {studyCards.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--text-muted)]">{emptyCopy}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {studyCards.map((item, index) => {
            const open = Boolean(flipped[item.id]);
            const tone = PASTELS[index % PASTELS.length];
            return (
              <article key={item.id} className="group relative h-[240px]">
                <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Zoom in"
                    className="rounded-full bg-white/80 p-1.5 text-[#2c2410] shadow-sm hover:bg-white"
                    onClick={() => openCard(item, "view")}
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Edit card"
                    className="rounded-full bg-white/80 p-1.5 text-[#2c2410] shadow-sm hover:bg-white"
                    onClick={() => openCard(item, "edit")}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                <button type="button" className="lyra-flip" onClick={() => toggleFlip(item.id)}>
                  <div className={cn("lyra-flip-inner", open && "is-flipped")}>
                    <div className={cn("lyra-face flex flex-col rounded-md p-4 text-left shadow-sm", tone)}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">Q{index + 1}</p>
                      <p className="mt-3 flex-1 text-[15px] font-medium leading-snug">{item.front}</p>
                      <p className="mt-4 text-[11px] opacity-55">tap to flip</p>
                    </div>
                    <div className={cn("lyra-face lyra-face-back flex flex-col rounded-md p-4 text-left shadow-sm", tone)}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">A{index + 1}</p>
                      <p className="mt-3 flex-1 overflow-y-auto text-[14px] font-medium leading-snug">{item.back}</p>
                      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <span
                          role="button"
                          tabIndex={0}
                          className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-[#14532d]"
                          onClick={(e) => {
                            e.stopPropagation();
                            void rate(item, "good");
                          }}
                        >
                          <Check size={12} /> Got it
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-[#7c2d12]"
                          onClick={(e) => {
                            e.stopPropagation();
                            void rate(item, "again");
                          }}
                        >
                          <Star size={12} /> Still shaky
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {overlay && card
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8">
              <button type="button" className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-md" aria-label="Close flashcard" onClick={closeOverlay} />
              <div
                className={cn(
                  "relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-md shadow-2xl",
                  PASTELS[Math.max(overlayIndex, 0) % PASTELS.length],
                )}
              >
                <div className="flex items-center justify-between px-4 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
                    Q{overlayIndex + 1}
                    {overlay.mode === "edit" ? " · Edit" : ""}
                  </p>
                  <div className="flex gap-1">
                    {overlay.mode === "view" ? (
                      <button type="button" className="rounded-full bg-white/80 p-1.5" aria-label="Edit card" onClick={() => openCard(card, "edit")}>
                        <Pencil size={14} />
                      </button>
                    ) : null}
                    <button type="button" className="rounded-full bg-white/80 p-1.5" aria-label="Close" onClick={closeOverlay}>
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {overlay.mode === "edit" ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-3">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
                      Question
                      <textarea
                        value={draft.front}
                        onChange={(e) => setDraft((d) => ({ ...d, front: e.target.value }))}
                        className="mt-1 min-h-24 w-full resize-y rounded-md border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#1e1a2b] outline-none"
                      />
                    </label>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
                      Answer
                      <textarea
                        value={draft.back}
                        onChange={(e) => setDraft((d) => ({ ...d, back: e.target.value }))}
                        className="mt-1 min-h-28 w-full resize-y rounded-md border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#1e1a2b] outline-none"
                      />
                    </label>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
                      Why it matters
                      <textarea
                        value={draft.explanation}
                        onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
                        className="mt-1 min-h-16 w-full resize-y rounded-md border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#1e1a2b] outline-none"
                      />
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <button type="button" disabled={saving} onClick={() => void saveEdit()} className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium">
                        <Save size={14} /> Save
                      </button>
                      <button type="button" onClick={() => setOverlay({ id: card.id, mode: "view" })} className="inline-flex items-center gap-1.5 text-sm opacity-80">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col px-5 pb-5 pt-2">
                    <p className="text-[15px] font-medium leading-relaxed">{card.front}</p>
                    {flipped[card.id] ? (
                      <>
                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">Answer</p>
                        <p className="mt-1 text-[15px] leading-relaxed">{card.back}</p>
                        {card.explanation ? <p className="mt-3 text-sm leading-relaxed opacity-70">{card.explanation}</p> : null}
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md bg-white/85 px-3 py-1.5 text-xs font-medium"
                            onClick={() => void rate(card, "good")}
                          >
                            <Check size={13} /> Got it
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md bg-white/85 px-3 py-1.5 text-xs font-medium"
                            onClick={() => void rate(card, "again")}
                          >
                            <Star size={13} /> Still shaky
                          </button>
                        </div>
                      </>
                    ) : (
                      <button type="button" className="mt-auto pt-8 text-left text-[11px] opacity-55" onClick={() => toggleFlip(card.id)}>
                        tap to flip
                      </button>
                    )}
                  </div>
                )}

                {overlay.mode === "view" ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-black/10 px-4 py-3">
                    <button type="button" onClick={() => void flag(card, { bookmarked: !card.bookmarked })} className="inline-flex items-center gap-1 text-xs opacity-80">
                      <Bookmark size={13} className={card.bookmarked ? "fill-current" : ""} />
                      {card.bookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                    <button type="button" onClick={() => void copyCard(card)} className="inline-flex items-center gap-1 text-xs opacity-80">
                      <Copy size={13} /> Copy
                    </button>
                    <button type="button" onClick={closeOverlay} className="ml-auto inline-flex items-center gap-1 text-sm font-medium">
                      <X size={14} /> Close
                    </button>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
