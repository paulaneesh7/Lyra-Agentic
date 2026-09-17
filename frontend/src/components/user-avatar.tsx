import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  src,
  className,
  size = 32,
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
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--accent)] text-[11px] font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
