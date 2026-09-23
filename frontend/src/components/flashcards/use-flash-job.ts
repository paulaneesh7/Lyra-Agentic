"use client";

import { useSyncExternalStore } from "react";
import { getFlashJob, getFlashJobServer, subscribeFlashJob } from "@/lib/flash-job";

export function useFlashJob() {
  return useSyncExternalStore(subscribeFlashJob, getFlashJob, getFlashJobServer);
}
