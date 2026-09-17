"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader, ScreenLoader } from "@/components/ui/loader";
import { api } from "@/lib/api";

type EvalOut = {
  id: string;
  score: number;
  max_score: number;
  verdict: string;
  result: {
    correctness: number;
    approach: number;
    reasoning: number;
    efficiency: number;
    strengths: string[];
    mistakes: string[];
    corrected_solution: string;
    better_approach: string;
    key_takeaways: string[];
    common_trap: string;
    final_answer: string;
    uncertainty_notes: string;
  };
};

function Stars({ n }: { n: number }) {
  return <span>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

export default function EvaluationResultPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<EvalOut | null>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    api<EvalOut>(`/api/evaluations/${params.id}`).then(setData).catch((e) => toast.error(e.message));
  }, [params.id]);

  async function ask() {
    setAsking(true);
    try {
      const reply = await api<{ content: string }>(`/api/evaluations/${params.id}/chat`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setChat((c) => [...c, { role: "user", content: message }, { role: "assistant", content: reply.content }]);
      setMessage("");
    } finally {
      setAsking(false);
    }
  }

  if (!data) return <ScreenLoader />;
  const r = data.result || {};

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-[var(--muted)]">Formative score — not an official GATE mark</p>
        <h1 className="font-serif text-5xl">{data.score} / {data.max_score}</h1>
        <p className="mt-2 text-xl">{data.verdict}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>Correctness <div><Stars n={r.correctness || 1} /></div></Card>
        <Card>Approach <div><Stars n={r.approach || 1} /></div></Card>
        <Card>Reasoning <div><Stars n={r.reasoning || 1} /></div></Card>
        <Card>Efficiency <div><Stars n={r.efficiency || 1} /></div></Card>
      </div>
      <Card>
        <h2 className="font-medium">What you did well</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{(r.strengths || []).map((s) => <li key={s}>{s}</li>)}</ul>
        <h2 className="mt-4 font-medium">What went wrong</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{(r.mistakes || []).map((s) => <li key={s}>{s}</li>)}</ul>
        <h2 className="mt-4 font-medium">Step-by-step correction</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap">{r.corrected_solution}</p>
        <h2 className="mt-4 font-medium">Better approach</h2>
        <p className="mt-2 text-sm">{r.better_approach}</p>
        <h2 className="mt-4 font-medium">Key concept / trap</h2>
        <p className="mt-2 text-sm">{r.common_trap}</p>
        <h2 className="mt-4 font-medium">Final answer (AI explanation)</h2>
        <p className="mt-2 text-sm">{r.final_answer}</p>
        <p className="mt-4 text-xs text-[var(--muted)]">{r.uncertainty_notes}</p>
      </Card>
      <Card>
        <h2 className="font-medium">Ask about this evaluation</h2>
        <div className="mt-3 space-y-2 text-sm">
          {chat.map((m, i) => (
            <p key={i}><strong>{m.role}:</strong> {m.content}</p>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why is my approach wrong?" />
          <Button disabled={asking || !message.trim()} onClick={() => void ask().catch((e) => toast.error(e.message))}>
            {asking ? <Loader size="sm" /> : "Send"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
