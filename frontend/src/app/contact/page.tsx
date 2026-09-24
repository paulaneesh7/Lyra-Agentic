"use client";

import { FormEvent, useState } from "react";
import { InfoPage, InfoSection } from "@/components/info-page";
import { brand } from "@/lib/brand";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`${brand.short} — note from ${name || "a student"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:hello@qubrix.ai?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <InfoPage
      eyebrow="Contact"
      title="Write to us"
      lede="Questions about a score, a credit pack, or your account. We read every note."
    >
      <InfoSection title="What to include">
        <p>
          If a mark looks wrong, mention the subject and what you expected. If credits did not update, include the
          email on your {brand.short} account.
        </p>
      </InfoSection>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 sm:p-5">
        <label className="block text-sm">
          <span className="font-medium">Name</span>
          <input
            required
            name="name"
            autoComplete="name"
            className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Message</span>
          <textarea
            required
            name="message"
            rows={5}
            className="mt-1.5 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-text)] transition hover:bg-[var(--accent-hover)]"
        >
          Send message
        </button>
        {sent ? (
          <p className="text-xs text-[var(--text-muted)]">
            Your mail app should open with this note addressed to hello@qubrix.ai.
          </p>
        ) : null}
      </form>
    </InfoPage>
  );
}
