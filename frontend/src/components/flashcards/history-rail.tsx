"use client";

import { History, PanelLeftClose, PanelLeftOpen, Pin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ago, type FlashDeck, HISTORY_KEY } from "@/lib/flashcards";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

export function HistoryRail({
  decks,
  activeId,
  open,
  onOpenChange,
  query,
  onQuery,
  filter,
  onFilter,
  pins,
  onPin,
  loading = false,
}: {
  decks: FlashDeck[];
  activeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQuery: (q: string) => void;
  filter: "all" | "due" | "pinned";
  onFilter: (f: "all" | "due" | "pinned") => void;
  pins: string[];
  onPin: (id: string) => void;
  loading?: boolean;
}) {
  const router = useRouter();
  const dueTotal = decks.reduce((n, d) => n + (d.due_count || 0), 0);
  const q = query.trim().toLowerCase();
  const filtered = decks.filter((d) => {
    if (filter === "due" && !(d.due_count && d.due_count > 0)) return false;
    if (filter === "pinned" && !pins.includes(d.id)) return false;
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      (d.subject || "").toLowerCase().includes(q) ||
      (d.unit || "").toLowerCase().includes(q)
    );
  });

  function prefetchDeck(id: string) {
    router.prefetch(`/flashcards/${id}`);
  }

  function toggle() {
    const next = !open;
    localStorage.setItem(HISTORY_KEY, next ? "1" : "0");
    onOpenChange(next);
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-sidebar)] transition-[width] duration-200",
        open ? "w-[260px]" : "w-12",
      )}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-2 px-3 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Deck history</p>
            <Link
              href="/flashcards"
              prefetch
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium shadow-sm transition hover:border-[var(--accent)]"
            >
              <Plus size={12} /> New
            </Link>
          </div>
          <div className="px-3 pt-3">
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Search decks"
                className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] py-1.5 pl-7 pr-2.5 text-xs"
              />
            </div>
            <div className="mt-2 flex gap-1">
              {(["all", "due", "pinned"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onFilter(id)}
                  className={cn(
                    "flex-1 rounded-md px-1.5 py-1 text-[10px] font-medium capitalize",
                    filter === id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-muted)]",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              {dueTotal > 0 ? `${dueTotal} cards due across decks` : `${decks.length} GATE revision decks`}
            </p>
          </div>
          <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {filtered.length === 0 ? (
              loading ? (
                <div className="grid place-items-center py-16">
                  <Loader size="sm" />
                </div>
              ) : (
                <p className="px-2 py-8 text-xs leading-relaxed text-[var(--text-muted)]">
                  Decks you generate land here. Open one any time — each deck has its own link.
                </p>
              )
            ) : (
              filtered.map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    "group mb-1 rounded-md transition",
                    activeId === d.id ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-muted)]",
                  )}
                >
                  <Link
                    href={`/flashcards/${d.id}`}
                    prefetch
                    onMouseEnter={() => prefetchDeck(d.id)}
                    className="block w-full px-3 py-2.5 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{d.title}</p>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">{d.card_count}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {d.subject || `GATE ${d.paper || "CS"}`} · {ago(d.created_at)}
                      {d.due_count ? ` · ${d.due_count} due` : ""}
                    </p>
                  </Link>
                  <div className="flex justify-end px-2 pb-1.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"
                      onClick={() => onPin(d.id)}
                      aria-label="Pin deck"
                    >
                      <Pin size={12} className={pins.includes(d.id) ? "fill-[var(--accent)] text-[var(--accent)]" : ""} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2 border-t border-[var(--line)] px-3 py-3 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <PanelLeftClose size={14} /> Collapse
          </button>
        </>
      ) : (
        <div className="flex h-full flex-col items-center gap-3 py-4">
          <button type="button" onClick={toggle} className="rounded-md p-2 hover:bg-[var(--bg-muted)]" aria-label="Open deck history">
            <PanelLeftOpen size={16} />
          </button>
          <Link href="/flashcards" prefetch className="rounded-md p-2 hover:bg-[var(--bg-muted)]" aria-label="New deck">
            <Plus size={16} />
          </Link>
          <History size={16} className="mt-1 text-[var(--text-muted)]" />
        </div>
      )}
    </aside>
  );
}
