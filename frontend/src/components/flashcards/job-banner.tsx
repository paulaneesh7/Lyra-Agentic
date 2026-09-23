"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { useFlashJob } from "@/components/flashcards/use-flash-job";
import { flashJobLabel, takeReadyDeck } from "@/lib/flash-job";
import { cn } from "@/lib/utils";

export function FlashJobBanner({ className }: { className?: string }) {
  const job = useFlashJob();
  const router = useRouter();
  if (job.status === "idle") return null;

  const label = flashJobLabel(job);

  if (job.status === "running") {
    return (
      <div
        className={cn(
          "flex min-w-0 shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--accent)] sm:px-4 sm:text-sm",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <Loader size="sm" className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        const deck = takeReadyDeck();
        if (deck) router.push(`/flashcards/${deck.id}`);
      }}
      className={cn(
        "flex min-w-0 shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--accent-soft)] px-3 py-2 text-left text-xs font-medium text-[var(--accent)] sm:px-4 sm:text-sm",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ArrowRight size={14} className="shrink-0" />
    </button>
  );
}
