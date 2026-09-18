"use client";

import { History, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HistoryRail } from "@/components/flashcards/history-rail";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeId]);

  const railProps = {
    decks: flash.decks,
    activeId,
    query: flash.query,
    onQuery: flash.setQuery,
    filter: flash.historyFilter,
    onFilter: flash.setHistoryFilter,
    pins: flash.pins,
    onPin: flash.togglePin,
    loading: flash.loading,
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-screen lg:flex-row">
      <div className="hidden h-screen md:flex">
        <HistoryRail {...railProps} open={flash.historyOpen} onOpenChange={flash.setHistoryOpen} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2.5 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 text-sm font-medium"
          >
            <History size={16} /> Decks
          </button>
          <Link
            href="/flashcards"
            className="inline-flex h-9 items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 text-xs font-medium"
          >
            <Plus size={12} /> New
          </Link>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <MobileDrawer open={mobileOpen} onClose={closeMobile} title="Deck history" side="left" breakpoint="md">
        <HistoryRail {...railProps} open onOpenChange={() => setMobileOpen(false)} variant="sheet" />
      </MobileDrawer>
    </div>
  );
}
