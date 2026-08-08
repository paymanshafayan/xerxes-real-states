"use client";

/**
 * fetch() wrapper that attaches the staff/admin bearer token (stored in
 * sessionStorage at login) to requests. Use this for any call into a
 * route protected by requireStaff/getStaff on the server.
 */
export function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null;
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(input, { ...init, headers });
}
