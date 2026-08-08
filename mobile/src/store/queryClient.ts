import { QueryClient } from "@tanstack/react-query";

// Module-level reference to the React Query client so non-React modules
// (e.g. the Ably realtime manager) can invalidate queries.
let ref: QueryClient | null = null;

export function setQueryClient(c: QueryClient) {
  ref = c;
}

export function getQueryClient(): QueryClient | null {
  return ref;
}
