import { createClient } from "@supabase/supabase-js";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  return admins.includes(email.toLowerCase());
}

/**
 * Verifies the request's bearer token and returns the authed user's email
 * if it's in the ADMIN_EMAILS allowlist. Returns null otherwise.
 */
export async function getAdminFromRequest(
  req: Request
): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const userClient = createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user?.email) return null;
  if (!isAdminEmail(data.user.email)) return null;

  return { id: data.user.id, email: data.user.email };
}
