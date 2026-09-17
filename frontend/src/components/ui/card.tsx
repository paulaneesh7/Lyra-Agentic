import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow)]",
        className,
      )}
      {...props}
    />
  );
}
