import { notifyAuthSession } from "@/lib/auth-session";
import { apiUrl } from "@/lib/brand";

const TOKEN_KEY = "qubrix.access";
const LEGACY_TOKEN_KEY = "gatepilot.access";
const CREDITS_KEY = "qubrix.credits";
const REQUEST_MS = 12_000;

let handlingSessionExpiry = false;

function isAuthCredentialPath(path: string) {
  return (
    path.includes("/api/auth/login") ||
    path.includes("/api/auth/signup") ||
    path.includes("/api/auth/google")
  );
}

/** Any 401 outside login/signup means the access token is missing or invalid. */
function isSessionExpiredStatus(status: number) {
  return status === 401;
}

/** Clear the session and hard-navigate to login. Returns true if a redirect was started. */
function handleSessionExpired(message?: string): boolean {
  if (typeof window === "undefined") return false;
  if (handlingSessionExpiry) return true;
  if (window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/auth/")) {
    clearSession();
    return false;
  }
  handlingSessionExpiry = true;
  clearSession();
  try {
    sessionStorage.setItem(
      "qubrix.flash",
      JSON.stringify({
        type: "session-expired",
        message: message?.trim() || "Session expired. Please sign in again.",
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
  const next = `${window.location.pathname}${window.location.search}`;
  const login =
    next && next !== "/"
      ? `/login?next=${encodeURIComponent(next)}&reason=session`
      : "/login?reason=session";
  window.location.assign(login);
  return true;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setSession(access: string) {
  const previous = getToken();
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  if (previous !== access) notifyAuthSession(access);
}

export function clearSession() {
  const previous = getToken();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(CREDITS_KEY);
  if (previous) notifyAuthSession(null);
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
  window.dispatchEvent(new CustomEvent("qubrix-credits", { detail: balance }));
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
    const aborted =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError");
    throw new ApiError(
      aborted
        ? "The API took too long to respond. Please try again."
        : "Cannot reach the API at localhost:8000. If the backend is running, retry ? a long evaluation may have dropped the connection.",
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
    if (!isAuthCredentialPath(path) && isSessionExpiredStatus(res.status)) {
      if (handleSessionExpired(message)) {
        // Redirect started ? don't reject into Next's error overlay.
        return new Promise<T>(() => {});
      }
      throw new ApiError(message, res.status, code);
    }
    throw new ApiError(message, res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function* streamSse(
  path: string,
  body: unknown,
  timeoutMs = 120_000,
): AsyncGenerator<Record<string, unknown>> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError");
    throw new ApiError(
      aborted ? "The follow-up took too long. Please try again." : "Cannot reach the API at localhost:8000.",
      0,
      aborted ? "api_timeout" : "api_unreachable",
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    let code: string | undefined;
    try {
      const payload = await res.json();
      message = payload?.error?.message ?? message;
      code = payload?.error?.code;
    } catch {
      /* ignore */
    }
    if (isSessionExpiredStatus(res.status)) {
      if (handleSessionExpired(message)) return;
      throw new ApiError(message, res.status, code);
    }
    throw new ApiError(message, res.status, code);
  }
  if (!res.body) throw new ApiError("Streaming is not available from the API.", 0, "no_stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      yield JSON.parse(raw) as Record<string, unknown>;
    }
  }
}
