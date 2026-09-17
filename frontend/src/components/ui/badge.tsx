import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "sage" | "warn" | "brass";
}) {
  const map = {
    neutral: "bg-[var(--paper-2)] text-[var(--muted)]",
    sage: "bg-[#e7eee9] text-[var(--sage)]",
    warn: "bg-[#f6ebe4] text-[#8a4b32]",
    brass: "bg-[#f3ead8] text-[#7a6233]",
  };
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}
