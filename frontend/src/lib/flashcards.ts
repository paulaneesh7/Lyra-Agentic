export type FlashCard = {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  difficulty?: string;
  bookmarked?: boolean;
  known?: boolean;
  marked_difficult?: boolean;
  status?: string;
  repetitions?: number;
  next_review_at?: string | null;
};

export type FlashDeck = {
  id: string;
  title: string;
  focus: string;
  subject?: string;
  unit?: string;
  paper?: string;
  card_count: number;
  due_count?: number;
  known_count?: number;
  shaky_count?: number;
  bookmarked_count?: number;
  created_at?: string | null;
  cards: FlashCard[];
  credits_left?: number;
};

export const HISTORY_KEY = "lyra.flash.historyOpen";
export const PINS_KEY = "lyra.flash.pins";

export const PASTELS = [
  "bg-[#FFF59D] text-[#3d3208]",
  "bg-[#FBCFE8] text-[#4a1d36]",
  "bg-[#BBF7D0] text-[#14532d]",
  "bg-[#BAE6FD] text-[#0c4a6e]",
  "bg-[#E9D5FF] text-[#3b0764]",
  "bg-[#FED7AA] text-[#7c2d12]",
  "bg-[#A7F3D0] text-[#064e3b]",
  "bg-[#FECACA] text-[#7f1d1d]",
];

export function ago(iso?: string | null) {
  if (!iso) return "just now";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

export function loadPins(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PINS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePins(ids: string[]) {
  localStorage.setItem(PINS_KEY, JSON.stringify(ids));
}
