import { onAuthSession } from "@/lib/auth-session";
import { api, getToken } from "@/lib/api";
import type { FlashCard, FlashDeck } from "@/lib/flashcards";

const CACHE_PREFIX = "lyra.flash.decks.v1";

let decks: FlashDeck[] = [];
let hydrated = false;
let inflight: Promise<FlashDeck[]> | null = null;
let generation = 0;
/** undefined until the module has adopted the current token. */
let boundToken: string | null | undefined;
const listeners = new Set<() => void>();

function fingerprint(token: string) {
  let a = 2166136261;
  let b = 2166136261;
  for (let i = 0; i < token.length; i++) {
    const code = token.charCodeAt(i);
    a ^= code;
    a = Math.imul(a, 16777619);
    b ^= code + i;
    b = Math.imul(b, 2246822519);
  }
  return `${(a >>> 0).toString(16)}${(b >>> 0).toString(16)}`;
}

function storageKey(token: string) {
  return `${CACHE_PREFIX}.${fingerprint(token)}`;
}

function clearDeckStorage() {
  if (typeof window === "undefined") return;
  const drop: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) drop.push(key);
  }
  for (const key of drop) sessionStorage.removeItem(key);
}

function persist() {
  if (typeof window === "undefined" || !boundToken) return;
  try {
    sessionStorage.setItem(storageKey(boundToken), JSON.stringify(decks));
  } catch {
    /* quota */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
  persist();
}

function dropOtherDeckCaches(token: string | null) {
  if (typeof window === "undefined") return;
  const keep = token ? storageKey(token) : null;
  const drop: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key || !key.startsWith(CACHE_PREFIX) || key === keep) continue;
    drop.push(key);
  }
  for (const key of drop) sessionStorage.removeItem(key);
}

function readCache(token: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(storageKey(token));
    decks = raw ? (JSON.parse(raw) as FlashDeck[]) : [];
  } catch {
    decks = [];
  }
}

/** Drop in-memory decks when the access token changes, and restore only this token's cache. */
function adoptSession(token: string | null) {
  if (token === boundToken) return;
  const previous = boundToken;
  boundToken = token;
  generation += 1;
  inflight = null;
  decks = [];
  hydrated = true;
  if (previous !== undefined) clearDeckStorage();
  else if (token) {
    readCache(token);
    dropOtherDeckCaches(token);
  } else dropOtherDeckCaches(null);
  listeners.forEach((fn) => fn());
  if (token && previous === undefined) persist();
}

adoptSession(typeof window === "undefined" ? null : getToken());
onAuthSession(adoptSession);

export function hydrateFlashCache() {
  if (!hydrated) adoptSession(typeof window === "undefined" ? null : getToken());
  return decks;
}

export function getFlashDecks() {
  return decks;
}

export function subscribeFlashDecks(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function accepts(owner: string | null) {
  return Boolean(boundToken) && owner === boundToken && getToken() === boundToken;
}

export function setFlashDecks(
  next: FlashDeck[] | ((prev: FlashDeck[]) => FlashDeck[]),
  owner: string | null = boundToken ?? null,
) {
  if (!accepts(owner)) return;
  decks = typeof next === "function" ? next(decks) : next;
  emit();
}

export function upsertFlashDeck(deck: FlashDeck, owner: string | null = boundToken ?? null) {
  if (!accepts(owner)) return;
  decks = [deck, ...decks.filter((d) => d.id !== deck.id)];
  emit();
}

export function removeFlashDeck(id: string, owner: string | null = boundToken ?? null) {
  if (!accepts(owner)) return;
  decks = decks.filter((d) => d.id !== id);
  emit();
}

export function patchFlashCard(deckId: string, card: FlashCard, owner: string | null = boundToken ?? null) {
  if (!accepts(owner)) return;
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
  const gen = generation;
  const token = boundToken ?? null;
  if (!token) {
    decks = [];
    listeners.forEach((fn) => fn());
    return [];
  }
  if (inflight) return inflight;
  const run = api<FlashDeck[]>("/api/flashcards/decks")
    .then((fresh) => {
      if (gen !== generation || boundToken !== token) {
        if (inflight === run) inflight = null;
        return getFlashDecks();
      }
      setFlashDecks(fresh, token);
      if (inflight === run) inflight = null;
      return fresh;
    })
    .catch((err) => {
      if (inflight === run) inflight = null;
      throw err;
    });
  inflight = run;
  if (!force && decks.length > 0) return run;
  return run;
}
