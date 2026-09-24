"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LogIn } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { GoogleButton } from "@/components/google-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader } from "@/components/ui/loader";
import { getToken } from "@/lib/api";
import { clearGoogleAuthPending, GOOGLE_SIGNIN_TOAST_ID } from "@/lib/google-auth";

function LoginInner() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const triedStoredSession = useRef(false);

  useEffect(() => {
    const error = params.get("error");
    if (error === "google") {
      clearGoogleAuthPending();
      toast.dismiss(GOOGLE_SIGNIN_TOAST_ID);
      toast.error("Sign-in failed", {
        id: "google-signin-failed",
        description: "Google sign-in didn’t complete. Please try again.",
      });
    }

    const reason = params.get("reason");
    if (reason === "session") {
      toast.error("Session expired. Please sign in again.", { id: "session-expired" });
    }

    try {
      const raw = sessionStorage.getItem("qubrix.flash");
      if (!raw) return;
      sessionStorage.removeItem("qubrix.flash");
      const flash = JSON.parse(raw) as { type?: string; message?: string };
      if (flash.type === "session-expired") {
        toast.error(flash.message || "Session expired. Please sign in again.", {
          id: "session-expired",
        });
      }
    } catch {
      /* ignore */
    }
  }, [params]);

  useEffect(() => {
    if (loading) return;
    if (user) {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      return;
    }
    if (getToken() && !triedStoredSession.current) {
      triedStoredSession.current = true;
      void refresh();
    }
  }, [loading, user, refresh, router, params]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--bg)] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[var(--accent)]/14 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-[var(--flash)]/12 blur-3xl"
      />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--line)] bg-[linear-gradient(135deg,var(--accent-soft)_0%,var(--bg-elevated)_48%,var(--flash-soft)_100%)] px-10 py-11 text-center shadow-[var(--shadow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--accent)] opacity-[0.08] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-[var(--flash)] opacity-[0.08] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_40%,var(--flash)_50%),transparent)]"
        />

        <div className="relative">
          <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-md bg-[var(--bg-elevated)] text-[var(--accent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_28%,var(--line))]">
            <LogIn size={20} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your dashboard</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Access answer evaluation, flashcards, credits, and your saved progress.
          </p>

          <div className="mt-8 space-y-3">
            {loading ? (
              <div className="grid place-items-center py-3">
                <Loader />
              </div>
            ) : (
              <GoogleButton className="h-10 rounded-md border border-[var(--accent)]/40 bg-[var(--bg-elevated)] py-0 text-[var(--accent)] shadow-sm" />
            )}

            <Link
              href="/"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)]/80 px-4 text-sm font-medium text-[var(--text-muted)]"
            >
              <ArrowLeft size={15} strokeWidth={1.75} />
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[var(--bg)]">
          <Loader />
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
