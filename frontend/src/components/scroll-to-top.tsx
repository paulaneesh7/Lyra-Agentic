"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Rising Vega spark — brand-native, not an arrow. */
function RiseSpark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("block", className)}
    >
      <circle cx="12" cy="20.4" r="1.35" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="16.6" r="1.7" fill="currentColor" opacity="0.5" />
      <path
        d="M12 2.2L13.7 7.5L19.4 8.05L14.95 11.75L16.25 17.3L12 14.35L7.75 17.3L9.05 11.75L4.6 8.05L10.3 7.5L12 2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Landing-page only. Fixed control that eases back to the top. */
export function ScrollToTop({
  threshold = 420,
  className,
}: {
  threshold?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  function goTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={goTop}
      className={cn(
        "fixed z-40 inline-flex items-center justify-center",
        "right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6",
        "h-11 w-11 rounded-md sm:h-12 sm:w-12",
        "border border-[var(--accent)]/45 bg-[var(--bg-elevated)] text-[var(--accent)]",
        "shadow-[0_8px_24px_rgba(30,26,43,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        "active:scale-[0.96]",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
        className,
      )}
    >
      <RiseSpark className="h-7 w-7 sm:h-[30px] sm:w-[30px]" />
    </button>
  );
}
