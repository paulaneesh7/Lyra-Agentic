import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${brand.short} to practise GATE answers.`,
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      lede={`${brand.short} is a practice tool for GATE Computer Science. These terms cover how you use evaluations, credits, and your account.`}
    >
      <InfoSection title="What the product is">
        <p>
          {brand.short} scores practice answers and builds revision decks. Marks, comments, and suggestions are
          formative feedback for study. They are not an official GATE result, a coaching guarantee, or advice from the
          exam authorities.
        </p>
        <p>We are not affiliated with the IITs, IISc, or the organisers of GATE.</p>
      </InfoSection>
      <InfoSection title="Your account">
        <p>
          You sign in with Google. You are responsible for the activity on your account and for keeping access to that
          Google account. We may suspend an account that abuses the service, attempts to break it, or uploads content
          you do not have the right to share.
        </p>
      </InfoSection>
      <InfoSection title="Credits">
        <p>
          Evaluations and flashcard generation spend prepaid credits. Reviewing cards you already have does not.
          Credits are for use inside {brand.short}. Unless a payment provider requires otherwise, unused credits are
          not cash and are not transferred between accounts.
        </p>
      </InfoSection>
      <InfoSection title="Your writing">
        <p>
          You keep ownership of the questions and answers you submit. You give us permission to process that text so we
          can score it, generate cards, and show the result back to you. Do not upload someone else’s work if you are
          not allowed to.
        </p>
      </InfoSection>
      <InfoSection title="The service can change">
        <p>
          Features, credit costs, and model behaviour can change as the product improves. We may suspend the service
          for maintenance. These terms apply to the version of {brand.short} you are using today.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
