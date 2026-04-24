import { createClient } from "@supabase/supabase-js";

/**
 * Resolves the requester's userId for data API routes.
 *
 * Rules:
 * - If Authorization: Bearer <supabase_jwt> is present, validate the token.
 *   - Valid: require bodyUserId (if provided) to match the token's user.id.
 *     Returns { userId: token's uid, authed: true }.
 *   - Invalid token: returns { error: "invalid_token" }.
 * - If no Authorization header: guest mode. Trust bodyUserId (local uuid).
 *   Returns { userId: bodyUserId, authed: false }.
 *   Rejects if bodyUserId is missing.
 *
 * This prevents an attacker from scraping an authed user's data by just
 * guessing/stealing their uid — they would also need the JWT.
 * Guests are still trust-based (random local uuids are low-value targets).
 */
export async function resolveUserId(
  req: Request,
  bodyUserId: string | null | undefined
): Promise<
  | { userId: string; authed: boolean }
  | { error: "no_user_id" | "invalid_token" | "userid_mismatch" }
> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return { error: "invalid_token" };

    const userClient = createClient(url, anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data?.user?.id) return { error: "invalid_token" };

    const tokenUid = data.user.id;
    if (bodyUserId && bodyUserId !== tokenUid) {
      return { error: "userid_mismatch" };
    }
    return { userId: tokenUid, authed: true };
  }

  if (!bodyUserId) return { error: "no_user_id" };
  return { userId: bodyUserId, authed: false };
}
