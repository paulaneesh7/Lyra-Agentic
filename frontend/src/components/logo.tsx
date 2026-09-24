import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Qubrix mark — constellation lyre with Vega at the crown. */
export function QubrixMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md",
        "bg-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
        className,
      )}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_15%,rgba(255,255,255,0.28),transparent_55%)]" />
      {/* Cropped viewBox zooms the glyph so it reads clearly at 32px */}
      <svg width="22" height="22" viewBox="2.5 1.5 19 20.5" fill="none" className="relative">
        <path
          d="M12 2.2L12.95 4.85L15.7 5.1L13.55 6.9L14.2 9.6L12 8.2L9.8 9.6L10.45 6.9L8.3 5.1L11.05 4.85L12 2.2Z"
          fill="white"
        />
        <path
          d="M6.6 8.9C6.6 6.2 17.4 6.2 17.4 8.9"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M6.6 8.9C5.7 12.2 5.35 15.8 7 18.9M17.4 8.9C18.3 12.2 18.65 15.8 17 18.9"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path d="M8 13.1H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M9.7 9.3V16.4M12 8.9V17.2M14.3 9.3V16.4"
          stroke="white"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M8.6 19.1C10 20.2 14 20.2 15.4 19.1"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  compact = false,
  className,
  subtitle = brand.line,
  hideSubtitleOnMobile = false,
}: {
  compact?: boolean;
  className?: string;
  subtitle?: string;
  /** Hide the tagline below `md` (useful in tight mobile headers). */
  hideSubtitleOnMobile?: boolean;
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
      <QubrixMark />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-semibold tracking-tight text-[var(--text)]">
            {brand.short}
          </span>
          <span
            className={cn(
              "block text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]",
              hideSubtitleOnMobile && "hidden md:block",
            )}
          >
            {subtitle}
          </span>
        </span>
      )}
    </Link>
  );
}
