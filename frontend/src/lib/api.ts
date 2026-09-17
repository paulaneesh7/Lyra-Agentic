import { apiUrl } from "@/lib/brand";

const TOKEN_KEY = "lyra.access";
const LEGACY_TOKEN_KEY = "gatepilot.access";
const CREDITS_KEY = "lyra.credits";
const REQUEST_MS = 12_000;

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setSession(access: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(CREDITS_KEY);
}

export function peekCredits(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CREDITS_KEY);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function cacheCredits(balance: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CREDITS_KEY, String(balance));
  window.dispatchEvent(new CustomEvent("lyra-credits", { detail: balance }));
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = REQUEST_MS, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!headers.has("Content-Type") && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const timeout = !rest.signal;
  const controller = timeout ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      ...rest,
      headers,
      signal: rest.signal ?? controller?.signal,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      aborted
        ? "The API took too long to respond. Please try again."
        : "Cannot reach the API at localhost:8000. Start the FastAPI backend (and Postgres) first, then try again.",
      0,
      aborted ? "api_timeout" : "api_unreachable",
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    let code: string | undefined;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
      code = body?.error?.code;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
