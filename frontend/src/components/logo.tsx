import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  className,
  subtitle = "Study dashboard",
}: {
  compact?: boolean;
  className?: string;
  subtitle?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-md outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-sidebar)]",
        className,
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--accent)]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 13.5V2.5L12 8.2V13.5"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="4.2" r="1.3" fill="white" />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] font-semibold tracking-tight text-[var(--text)]">{brand.short}</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {subtitle}
          </span>
        </span>
      )}
    </Link>
  );
}
