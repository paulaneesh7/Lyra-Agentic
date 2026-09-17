"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-serif text-4xl">Profile</h1>
      <Card>
        <p className="text-sm">{user?.full_name}</p>
        <p className="text-sm text-[var(--muted)]">{user?.email}</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => api("/api/study-plan/generate", { method: "POST" }).then(() => toast.success("Study plan generated"))}
        >
          Generate study plan
        </Button>
        <Button className="mt-3" variant="ghost" onClick={logout}>Sign out</Button>
      </Card>
    </div>
  );
}
