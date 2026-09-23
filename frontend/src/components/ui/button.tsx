import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] shadow-[0_10px_24px_var(--ring)]",
  secondary:
    "bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--line)] hover:bg-[var(--bg-muted)]",
  ghost: "text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]",
  soft: "bg-[var(--accent-soft)] text-[var(--accent)] hover:opacity-90",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
