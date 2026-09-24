"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { clearGoogleAuthPending, GOOGLE_SIGNIN_TOAST_ID } from "@/lib/google-auth";
import { setSession } from "@/lib/api";

function readAccessToken(params: URLSearchParams) {
  const fromQuery = params.get("access_token");
  if (fromQuery) return fromQuery;
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash).get("access_token");
}

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    clearGoogleAuthPending();
    toast.dismiss(GOOGLE_SIGNIN_TOAST_ID);
    const token = readAccessToken(params);
    if (!token) {
      toast.error("Sign-in failed", {
        id: "google-signin-failed",
        description: "Google sign-in was cancelled or did not complete. Please try again.",
      });
      router.replace("/login");
      return;
    }

    setSession(token);
    sessionStorage.setItem("qubrix.flash", "signed-in");
    window.location.replace("/dashboard");
  }, [params, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)]">
      <Loader />
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[var(--bg)]">
          <Loader />
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
