"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import { api } from "@/lib/api";

const MODES = ["explain", "teach", "quiz", "example", "hint", "step_by_step", "revision"];

export default function TutorPage() {
  const [mode, setMode] = useState("explain");
  const [message, setMessage] = useState("Explain TCP congestion control.");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [log, setLog] = useState<{ role: string; content: string }[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const res = await api<{ thread_id: string; content: string }>("/api/tutor/message", {
        method: "POST",
        body: JSON.stringify({ message, mode, thread_id: threadId }),
      });
      setThreadId(res.thread_id);
      setLog((l) => [...l, { role: "user", content: message }, { role: "assistant", content: res.content }]);
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tutor unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl">AI Tutor</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Exam-aware help. Personal identity is not sent — only paper, mode, and topic context.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Button key={m} variant={mode === m ? "primary" : "secondary"} onClick={() => setMode(m)}>{m}</Button>
        ))}
      </div>
      <Card className="mt-6 min-h-64 space-y-3">
        {log.length === 0 && !busy && <p className="text-sm text-[var(--muted)]">Ask for an explanation, a quiz, or a worked example.</p>}
        {log.map((m, i) => (
          <p key={i} className="whitespace-pre-wrap text-sm"><strong>{m.role}:</strong> {m.content}</p>
        ))}
        {busy && (
          <div className="flex justify-center py-4">
            <Loader size="sm" />
          </div>
        )}
      </Card>
      <div className="mt-4 space-y-3">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button disabled={busy} onClick={() => void send()}>
          {busy ? <Loader size="sm" /> : "Send"}
        </Button>
      </div>
    </div>
  );
}
