"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { apiUrl } from "@/lib/brand";
import {
  GOOGLE_SIGNIN_TOAST_ID,
  markGoogleAuthPending,
  recoverGoogleAuthUi,
} from "@/lib/google-auth";
import { cn } from "@/lib/utils";

export function GoogleGlyph({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      className={cn("block shrink-0", className)}
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13.2 24 13.2c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.5 7.4l6.2 5.2C37.8 38.3 44 32.5 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleButton({
  className,
  label = "Continue with Google",
  variant = "soft",
}: {
  className?: string;
  label?: ReactNode;
  variant?: "soft" | "header";
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function resetBusy() {
      setBusy(false);
    }

    function recoverIfNeeded() {
      resetBusy();
      // Don't treat the OAuth callback landing as a cancel
      if (window.location.pathname.startsWith("/auth/callback")) return;
      recoverGoogleAuthUi({ announceCancel: true });
    }

    function onPageShow() {
      recoverIfNeeded();
    }

    function onVisible() {
      if (document.visibilityState === "visible") recoverIfNeeded();
    }

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    recoverIfNeeded();

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function startGoogle() {
    if (busy) return;
    setBusy(true);
    markGoogleAuthPending();
    toast.loading("Opening Google…", { id: GOOGLE_SIGNIN_TOAST_ID });
    window.location.assign(`${apiUrl}/api/auth/google`);
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={startGoogle}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-medium leading-none disabled:cursor-wait disabled:opacity-70",
        variant === "soft" &&
          "h-11 w-full rounded-md bg-[var(--accent-soft)] px-5 text-[var(--accent)]",
        variant === "header" &&
          "h-9 rounded-md bg-[var(--accent-soft)] px-3.5 text-[var(--accent)] sm:min-w-[13.75rem] sm:px-4",
        className,
      )}
    >
      {busy ? (
        <>
          <Loader size="sm" />
          <span className="leading-none">Opening…</span>
        </>
      ) : (
        <>
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
            <GoogleGlyph size={16} />
          </span>
          <span className="leading-none">{label}</span>
        </>
      )}
    </button>
  );
}
