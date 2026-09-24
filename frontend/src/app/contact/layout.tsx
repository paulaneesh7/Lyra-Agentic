import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to the ${brand.short} team about a score, credits, or your account.`,
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
