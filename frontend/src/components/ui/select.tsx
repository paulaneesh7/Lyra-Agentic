"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  ariaLabel,
  className,
  variant = "pill",
  align = "left",
  disabled = false,
  menuTitle,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  variant?: "pill" | "field";
  align?: "left" | "right";
  disabled?: boolean;
  menuTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, maxHeight: 280, bottom: 0 });
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  function updatePosition() {
    const el = rootRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const up = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(320, Math.max(160, up ? spaceAbove - gap : spaceBelow - gap));
    const longest = options.reduce((n, o) => Math.max(n, o.label.length), 0);
    const ideal = Math.min(340, Math.max(rect.width, 220, longest * 8.2 + 56));
    const width = Math.min(ideal, window.innerWidth - 16);
    const left =
      align === "right"
        ? Math.min(rect.right - width, window.innerWidth - width - 8)
        : Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setCoords({
      top: up ? rect.top - gap : rect.bottom + gap,
      bottom: up ? window.innerHeight - (rect.top - gap) : 0,
      left,
      width,
      maxHeight,
    });
    return up;
  }

  useLayoutEffect(() => {
    if (!open) return;
    setOpenUp(updatePosition());
    function onReposition() {
      setOpenUp(updatePosition());
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, align, options]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            className="qubrix-menu fixed z-[90] flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[0_24px_60px_rgba(20,16,32,0.18)]"
            style={{
              top: openUp ? undefined : coords.top,
              bottom: openUp ? coords.bottom : undefined,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
            }}
          >
            <div className="shrink-0 border-b border-[var(--line)] bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {menuTitle || ariaLabel || placeholder}
              </p>
            </div>
            <ul className="qubrix-menu-scroll min-h-0 flex-1 overflow-y-auto p-1.5 pb-2">
              {options.map((option, index) => {
                const active = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition",
                        active
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--text)] hover:bg-[var(--bg-muted)]",
                      )}
                    >
                      {active ? (
                        <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-[var(--accent)]" />
                      ) : null}
                      <span className="mt-0.5 w-5 shrink-0 text-[10px] font-semibold tabular-nums text-[var(--text-muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block whitespace-normal font-medium leading-snug">{option.label}</span>
                        {option.hint ? (
                          <span className="mt-0.5 block text-[11px] leading-snug text-[var(--text-muted)]">
                            {option.hint}
                          </span>
                        ) : null}
                      </span>
                      {active ? <Check size={15} className="mt-0.5 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative inline-block max-w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel || placeholder}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group inline-flex w-full max-w-full items-center gap-2 border text-left transition",
          "border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--text)]",
          "hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)]/35",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-[var(--accent)] bg-[var(--accent-soft)]/45 shadow-[0_0_0_3px_var(--ring)]",
          variant === "pill" && "rounded-full px-3.5 py-1.5 text-xs font-medium",
          variant === "field" && "rounded-xl px-3.5 py-2.5 text-sm",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-[var(--text-muted)] transition duration-200 group-hover:text-[var(--accent)]",
            open && "rotate-180 text-[var(--accent)]",
          )}
        />
      </button>
      {menu}
    </div>
  );
}
