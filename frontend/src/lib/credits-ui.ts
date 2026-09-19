import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Gift,
  Layers,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type CreditTx = {
  id: string;
  amount: number;
  type: string;
  note?: string | null;
  created_at: string;
  balance_after: number;
};

export type CreditTxTone = "accent" | "flash" | "credit" | "debit" | "neutral";

export type CreditTxMeta = {
  label: string;
  icon: LucideIcon;
  tone: CreditTxTone;
  category: "spend" | "add" | "adjust";
};

/** Keys match backend `CreditTransactionType`. */
export const CREDIT_TX_META: Record<string, CreditTxMeta> = {
  STARTER_CREDIT: { label: "Welcome credits", icon: Gift, tone: "credit", category: "add" },
  PURCHASE: { label: "Credit purchase", icon: Wallet, tone: "credit", category: "add" },
  AI_EVALUATION: { label: "Answer evaluation", icon: ClipboardList, tone: "accent", category: "spend" },
  FLASHCARD_GENERATION: {
    label: "Flashcard generation",
    icon: Layers,
    tone: "flash",
    category: "spend",
  },
  AI_TUTOR: { label: "Tutor message", icon: MessageCircle, tone: "neutral", category: "spend" },
  QUESTION_GENERATION: {
    label: "Question generation",
    icon: Sparkles,
    tone: "accent",
    category: "spend",
  },
  MOCK_ANALYSIS: { label: "Mock analysis", icon: ClipboardList, tone: "accent", category: "spend" },
  REFUND: { label: "Credit refund", icon: RefreshCcw, tone: "credit", category: "add" },
  ADMIN_ADJUSTMENT: {
    label: "Balance adjustment",
    icon: RefreshCcw,
    tone: "credit",
    category: "adjust",
  },
};

export function creditTxMeta(type: string, amount: number): CreditTxMeta {
  const known = CREDIT_TX_META[type];
  if (known) return known;
  const credit = amount >= 0;
  return {
    label: type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: credit ? ArrowDownLeft : ArrowUpRight,
    tone: credit ? "credit" : "debit",
    category: credit ? "add" : "spend",
  };
}

export function formatCreditTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatCreditDay(iso: string) {
  try {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(date, today)) return "Today";
    if (sameDay(date, yesterday)) return "Yesterday";
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

function dayKey(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  } catch {
    return iso;
  }
}

export function groupCreditTxByDay(transactions: CreditTx[]) {
  const groups: { key: string; label: string; items: CreditTx[] }[] = [];
  const map = new Map<string, CreditTx[]>();
  for (const tx of transactions) {
    const key = dayKey(tx.created_at);
    const list = map.get(key);
    if (list) list.push(tx);
    else map.set(key, [tx]);
  }
  for (const [key, items] of map) {
    groups.push({ key, label: formatCreditDay(items[0].created_at), items });
  }
  return groups;
}

export function summarizeCreditTx(transactions: CreditTx[]) {
  let added = 0;
  let spent = 0;
  for (const tx of transactions) {
    if (tx.amount >= 0) added += tx.amount;
    else spent += Math.abs(tx.amount);
  }
  return { added, spent, net: added - spent, count: transactions.length };
}
