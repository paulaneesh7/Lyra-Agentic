"use client";

import { History, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FlashJobBanner } from "@/components/flashcards/job-banner";
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
    // Row only from lg — below that the rail is a drawer (same pattern as evaluation).
    // Showing the rail from md while still flex-col made it h-full and crushed the studio to 0 height.
    <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="hidden h-full min-h-0 shrink-0 lg:flex">
        <HistoryRail {...railProps} open={flash.historyOpen} onOpenChange={flash.setHistoryOpen} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-3 py-2 lg:hidden">
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
        <FlashJobBanner />
        <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
      <MobileDrawer open={mobileOpen} onClose={closeMobile} title="Deck history" side="left" breakpoint="lg">
        <HistoryRail {...railProps} open onOpenChange={() => setMobileOpen(false)} variant="sheet" />
      </MobileDrawer>
    </div>
  );
}
