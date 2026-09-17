"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { GoogleButton } from "@/components/google-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader } from "@/components/ui/loader";
import { getToken } from "@/lib/api";

function LoginInner() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const triedStoredSession = useRef(false);

  useEffect(() => {
    const error = params.get("error");
    if (error === "google") {
      toast.error("Google sign-in failed. Please try again.");
    }
  }, [params]);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/dashboard");
      return;
    }
    if (getToken() && !triedStoredSession.current) {
      triedStoredSession.current = true;
      void refresh();
    }
  }, [loading, user, refresh, router]);

  return (
    <main className="relative grid min-h-screen place-items-center bg-[var(--bg)] px-4">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-10 py-12 text-center shadow-[var(--shadow)]">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
          <LogIn size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to your dashboard</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
          Access answer evaluation, flashcards, credits, and your saved progress.
        </p>
        <div className="mt-8">
          {loading ? (
            <div className="grid place-items-center py-3">
              <Loader />
            </div>
          ) : (
            <GoogleButton className="rounded-md py-3.5" />
          )}
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
