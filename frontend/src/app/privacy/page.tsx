import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${brand.short} handles your account, answers, and credits.`,
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      lede={`This page explains what ${brand.short} stores when you sign in, submit an answer, or buy credits.`}
    >
      <InfoSection title="What we collect">
        <p>
          When you sign in with Google, we receive your name, email address, and profile photo so we can create your
          account. When you practise, we store the questions, answers, scores, flashcards, and credit history tied to
          that account.
        </p>
      </InfoSection>
      <InfoSection title="Why we use it">
        <p>
          We use this information to sign you in, run evaluations, generate decks, show your progress, and keep a
          record of credits spent or purchased. Answer text is sent to the model provider configured for scoring. It is
          used to produce your feedback, not to train a public model on your behalf.
        </p>
      </InfoSection>
      <InfoSection title="Who else sees it">
        <p>
          Google handles sign-in. A model provider processes the text you ask us to score. A payment provider handles
          credit purchases if you buy a pack. We do not sell your answers or your contact details.
        </p>
      </InfoSection>
      <InfoSection title="How long it stays">
        <p>
          Your workspace data stays while your account is active so you can revisit scores and decks. You can sign out
          at any time. If you want the account removed, write to us from the contact page and we will delete the
          account data we still hold, except where we must keep a payment record.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
