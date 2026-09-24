import { toast } from "sonner";

export const GOOGLE_SIGNIN_TOAST_ID = "google-signin";
const PENDING_KEY = "qubrix.google-auth-pending";

export function markGoogleAuthPending() {
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearGoogleAuthPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isGoogleAuthPending() {
  try {
    return sessionStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Dismiss the stuck loading toast. If a Google redirect was abandoned, show a cancel message. */
export function recoverGoogleAuthUi(opts?: { announceCancel?: boolean }) {
  const pending = isGoogleAuthPending();
  clearGoogleAuthPending();
  toast.dismiss(GOOGLE_SIGNIN_TOAST_ID);

  if (pending && opts?.announceCancel !== false) {
    toast.message("Sign-in cancelled", {
      id: "google-signin-cancelled",
      description: "Google sign-in was closed before it finished. You can try again anytime.",
    });
  }
}
