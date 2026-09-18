"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function MobileDrawer({
  open,
  onClose,
  title,
  side = "left",
  children,
  className,
  breakpoint = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  className?: string;
  breakpoint?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70]",
        breakpoint === "md" ? "md:hidden" : "lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[color-mix(in_srgb,black_42%,transparent)] backdrop-blur-[3px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex flex-col bg-[var(--bg-sidebar)] shadow-[0_24px_80px_rgba(20,16,32,0.28)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          side === "left" && "inset-y-0 left-0 w-[min(88vw,320px)]",
          side === "right" && "inset-y-0 right-0 w-[min(94vw,420px)]",
          side === "bottom" && "inset-x-0 bottom-0 h-[min(92dvh,760px)] rounded-t-2xl bg-[var(--bg)]",
          side === "left" && (open ? "translate-x-0" : "-translate-x-full"),
          side === "right" && (open ? "translate-x-0" : "translate-x-full"),
          side === "bottom" && (open ? "translate-y-0" : "translate-y-full"),
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text)] transition hover:bg-[var(--bg-muted)]"
            aria-label={`Close ${title}`}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
