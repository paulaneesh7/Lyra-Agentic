"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeckBoard } from "@/components/flashcards/deck-board";
import { useFlashStudio } from "@/components/flashcards/use-flash-decks";
import { ScreenLoader } from "@/components/ui/loader";
import { removeFlashDeck, upsertFlashDeck } from "@/lib/flash-store";
import type { FlashDeck } from "@/lib/flashcards";

export default function FlashDeckPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const flash = useFlashStudio();
  const cached = flash.decks.find((d) => d.id === params.id) ?? null;
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setMissing(false);
    api<FlashDeck>(`/api/flashcards/decks/${params.id}`)
      .then(upsertFlashDeck)
      .catch(() => {
        if (!cached) setMissing(true);
      });
  }, [params.id]);

  async function remove() {
    if (!params.id) return;
    removeFlashDeck(params.id);
    router.replace("/flashcards");
    try {
      await api(`/api/flashcards/decks/${params.id}`, { method: "DELETE" });
      toast.success("Deck removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete deck");
      void api<FlashDeck[]>("/api/flashcards/decks").then((d) => flash.setDecks(d));
    }
  }

  if (missing) {
    return (
      <div className="grid flex-1 place-items-center px-4">
        <p className="text-sm text-[var(--text-muted)]">This deck was not found. Generate a new one from history.</p>
      </div>
    );
  }

  if (!cached) {
    return <ScreenLoader className="min-h-[50vh]" />;
  }

  return (
    <DeckBoard
      deck={cached}
      onDeck={upsertFlashDeck}
      onDelete={() => void remove()}
      pinned={flash.pins.includes(cached.id)}
      onPin={() => flash.togglePin(cached.id)}
    />
  );
}
