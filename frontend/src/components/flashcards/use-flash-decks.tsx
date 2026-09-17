"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { HISTORY_KEY, loadPins, savePins, type FlashDeck } from "@/lib/flashcards";
import {
  getFlashDecks,
  hydrateFlashCache,
  refreshFlashDecks,
  setFlashDecks,
  subscribeFlashDecks,
} from "@/lib/flash-store";

const FlashCtx = createContext<ReturnType<typeof useFlashDecksState> | null>(null);

function useFlashDecksState() {
  const [decks, setDecksState] = useState<FlashDeck[]>(() =>
    typeof window === "undefined" ? [] : hydrateFlashCache(),
  );
  const [historyOpen, setHistoryOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "due" | "pinned">("all");
  const [pins, setPins] = useState<string[]>([]);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return hydrateFlashCache().length === 0;
  });

  useEffect(() => {
    hydrateFlashCache();
    setDecksState(getFlashDecks());
    if (localStorage.getItem(HISTORY_KEY) === "0") setHistoryOpen(false);
    setPins(loadPins());
    const unsub = subscribeFlashDecks(() => setDecksState(getFlashDecks()));
    void refreshFlashDecks().finally(() => setLoading(false));
    return unsub;
  }, []);

  function togglePin(id: string) {
    setPins((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      savePins(next);
      return next;
    });
  }

  return {
    decks,
    setDecks: setFlashDecks,
    historyOpen,
    setHistoryOpen,
    query,
    setQuery,
    historyFilter,
    setHistoryFilter,
    pins,
    togglePin,
    loading,
  };
}

export function FlashProvider({ children }: { children: React.ReactNode }) {
  const value = useFlashDecksState();
  return <FlashCtx.Provider value={value}>{children}</FlashCtx.Provider>;
}

export function useFlashStudio() {
  const ctx = useContext(FlashCtx);
  if (!ctx) throw new Error("useFlashStudio must be used within FlashProvider");
  return ctx;
}
