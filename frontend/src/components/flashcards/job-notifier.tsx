"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFlashJob } from "@/components/flashcards/use-flash-job";
import { takeReadyDeck } from "@/lib/flash-job";

/** Stays mounted for every app page, so a finished deck is announced even after you leave Flashcards. */
export function FlashJobNotifier() {
  const job = useFlashJob();
  const router = useRouter();
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (job.status !== "ready") {
      announced.current = null;
      return;
    }
    const deck = job.deck;
    if (announced.current === deck.id) return;
    announced.current = deck.id;

    toast.success("Flashcards are ready", {
      id: `flash-ready-${deck.id}`,
      description: `${deck.card_count} cards · ${deck.title}`,
      duration: 14000,
      action: {
        label: "View deck",
        onClick: () => {
          const opened = takeReadyDeck();
          if (opened?.id === deck.id) router.push(`/flashcards/${deck.id}`);
        },
      },
    });
  }, [job, router]);

  return null;
}
