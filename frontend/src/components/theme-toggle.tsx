"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  variant = "outline",
}: {
  className?: string;
  /** `outline` on home/auth. `ghost` inside dashboard toolbars (avoids double border). */
  variant?: "outline" | "ghost";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const busy = useRef(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex h-8 w-8 shrink-0 rounded-lg",
          variant === "outline" && "border border-[var(--line)] bg-[var(--bg-elevated)]",
          className,
        )}
        aria-hidden
      />
    );
  }

  const dark = resolvedTheme === "dark";

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    if (busy.current) return;

    const next = dark ? "light" : "dark";
    const root = document.documentElement;
    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-r", `${Math.ceil(radius)}px`);

    const apply = () => setTheme(next);

    if (typeof document.startViewTransition !== "function") {
      apply();
      return;
    }

    busy.current = true;
    const transition = document.startViewTransition(apply);
    void transition.finished.finally(() => {
      busy.current = false;
    });
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg",
        "text-[var(--text-muted)] transition-colors duration-200",
        "hover:text-[var(--text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "active:scale-[0.97]",
        variant === "outline" &&
          "border border-[var(--line)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)]",
        variant === "ghost" && "border-0 bg-transparent hover:bg-[var(--bg-muted)]",
        className,
      )}
    >
      <span className="relative h-4 w-4">
        <Sun
          size={16}
          strokeWidth={1.5}
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0",
          )}
          aria-hidden
        />
        <Moon
          size={16}
          strokeWidth={1.5}
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            dark ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
          aria-hidden
        />
      </span>
    </button>
  );
}
