import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  src,
  className,
  size = 28,
}: {
  name: string;
  src?: string | null;
  className?: string;
  size?: number;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "U";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] p-[2px] ring-1 ring-[var(--accent)]/55",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={!src}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-[10px] font-semibold text-[var(--accent-text)]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </span>
    </span>
  );
}
