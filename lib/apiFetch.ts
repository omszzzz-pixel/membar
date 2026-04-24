"use client";

import { getBrowserSupabase } from "./supabase";

/**
 * fetch wrapper that automatically attaches the current Supabase auth token
 * as Authorization: Bearer header when the user is logged in.
 *
 * Server routes validate the token via resolveUserId() — so authed users are
 * protected from someone else passing their userId, while guests still work.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const sb = getBrowserSupabase();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
