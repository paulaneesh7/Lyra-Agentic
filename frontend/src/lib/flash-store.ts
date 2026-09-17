import { api } from "@/lib/api";
import type { FlashCard, FlashDeck } from "@/lib/flashcards";

const CACHE_KEY = "lyra.flash.decks.v1";

let decks: FlashDeck[] = [];
let hydrated = false;
let inflight: Promise<FlashDeck[]> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(decks));
  } catch {
    /* quota */
  }
}

export function hydrateFlashCache() {
  if (hydrated || typeof window === "undefined") return decks;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) decks = JSON.parse(raw) as FlashDeck[];
  } catch {
    decks = [];
  }
  return decks;
}

export function getFlashDecks() {
  return decks;
}

export function subscribeFlashDecks(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setFlashDecks(next: FlashDeck[] | ((prev: FlashDeck[]) => FlashDeck[])) {
  decks = typeof next === "function" ? next(decks) : next;
  emit();
}

export function upsertFlashDeck(deck: FlashDeck) {
  decks = [deck, ...decks.filter((d) => d.id !== deck.id)];
  emit();
}

export function removeFlashDeck(id: string) {
  decks = decks.filter((d) => d.id !== id);
  emit();
}

export function patchFlashCard(deckId: string, card: FlashCard) {
  decks = decks.map((deck) => {
    if (deck.id !== deckId) return deck;
    const cards = deck.cards.map((c) => (c.id === card.id ? { ...c, ...card } : c));
    return summarizeDeck({ ...deck, cards });
  });
  emit();
}

export function summarizeDeck(deck: FlashDeck): FlashDeck {
  const cards = deck.cards || [];
  return {
    ...deck,
    card_count: cards.length,
    known_count: cards.filter((c) => c.known).length,
    due_count: cards.filter((c) => c.status === "due").length,
    shaky_count: cards.filter((c) => c.marked_difficult).length,
    bookmarked_count: cards.filter((c) => c.bookmarked).length,
  };
}

export function applyRating(card: FlashCard, rating: "again" | "hard" | "good" | "easy"): FlashCard {
  const known = rating === "good" || rating === "easy";
  return {
    ...card,
    known,
    marked_difficult: !known,
    status: known ? "learning" : "due",
    repetitions: Math.max(card.repetitions || 0, known ? 1 : 0),
  };
}

export async function refreshFlashDecks(force = false) {
  if (inflight) return inflight;
  if (!force && decks.length > 0) {
    inflight = api<FlashDeck[]>("/api/flashcards/decks")
      .then((fresh) => {
        setFlashDecks(fresh);
        inflight = null;
        return fresh;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
    return inflight;
  }
  inflight = api<FlashDeck[]>("/api/flashcards/decks")
    .then((fresh) => {
      setFlashDecks(fresh);
      inflight = null;
      return fresh;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}
