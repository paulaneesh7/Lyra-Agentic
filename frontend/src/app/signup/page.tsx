"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { GoogleButton } from "@/components/google-button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await signup(fullName, email, password);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-8 text-center shadow-[var(--shadow)]">
        <Logo className="mb-6 justify-center" />
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles size={22} />
        </div>
        <h1 className="text-2xl font-semibold">Create your workspace</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-muted)]">
          75 starter credits. Jump straight into evaluation and flashcards.
        </p>
        <div className="mt-6">
          <GoogleButton />
        </div>
        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          or continue with email
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <form onSubmit={onSubmit} className="space-y-3 text-left">
          <Input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required minLength={8} placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader size="sm" /> Creating account…
              </>
            ) : (
              "Get started"
            )}
          </Button>
        </form>
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          Already studying? <Link href="/login" className="text-[var(--accent)]">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
