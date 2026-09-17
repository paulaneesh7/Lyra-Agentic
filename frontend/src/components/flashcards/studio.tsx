"use client";

import { History, Plus } from "lucide-react";
import Link from "next/link";
import { HistoryRail } from "@/components/flashcards/history-rail";
import type { useFlashStudio } from "@/components/flashcards/use-flash-decks";

export function FlashLayout({
  activeId,
  flash,
  children,
}: {
  activeId: string;
  flash: ReturnType<typeof useFlashStudio>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
      <div className="hidden h-screen md:flex">
        <HistoryRail
          decks={flash.decks}
          activeId={activeId}
          open={flash.historyOpen}
          onOpenChange={flash.setHistoryOpen}
          query={flash.query}
          onQuery={flash.setQuery}
          filter={flash.historyFilter}
          onFilter={flash.setHistoryFilter}
          pins={flash.pins}
          onPin={flash.togglePin}
          loading={flash.loading}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 md:hidden">
          <button type="button" onClick={() => flash.setHistoryOpen((open) => !open)} className="inline-flex items-center gap-1 text-sm">
            <History size={16} /> Decks
          </button>
          <Link href="/flashcards" className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-medium">
            <Plus size={12} /> New
          </Link>
        </div>
        {flash.historyOpen ? (
          <div className="max-h-64 overflow-y-auto border-b border-[var(--line)] md:hidden">
            <HistoryRail
              decks={flash.decks}
              activeId={activeId}
              open
              onOpenChange={flash.setHistoryOpen}
              query={flash.query}
              onQuery={flash.setQuery}
              filter={flash.historyFilter}
              onFilter={flash.setHistoryFilter}
              pins={flash.pins}
              onPin={flash.togglePin}
              loading={flash.loading}
            />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
