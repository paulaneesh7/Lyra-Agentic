"use client";

import { usePathname } from "next/navigation";
import { FlashLayout } from "@/components/flashcards/studio";
import { FlashProvider, useFlashStudio } from "@/components/flashcards/use-flash-decks";

function Shell({ children }: { children: React.ReactNode }) {
  const flash = useFlashStudio();
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const activeId = parts[0] === "flashcards" && parts[1] ? parts[1] : "new";
  return (
    <FlashLayout activeId={activeId} flash={flash}>
      {children}
    </FlashLayout>
  );
}

export default function FlashcardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <FlashProvider>
      <Shell>{children}</Shell>
    </FlashProvider>
  );
}
