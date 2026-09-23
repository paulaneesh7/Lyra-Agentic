/** Fired synchronously from setSession / clearSession so client caches can drop the previous user. */
type SessionListener = (token: string | null) => void;

const listeners = new Set<SessionListener>();

export function onAuthSession(listener: SessionListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAuthSession(token: string | null) {
  listeners.forEach((listener) => listener(token));
}
