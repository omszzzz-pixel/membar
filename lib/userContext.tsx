"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getBrowserSupabase } from "./supabase";
import { getUserId as getLocalUserId } from "./userId";
import { trackPixel } from "./pixel";

export type UserState = {
  loading: boolean;
  authed: boolean;
  userId: string; // effective id — auth.uid if logged in, else local uuid
  localUserId: string;
  authUserId: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type Ctx = UserState & {
  signInWithKakao: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<Ctx | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>({
    loading: true,
    authed: false,
    userId: "",
    localUserId: "",
    authUserId: null,
    email: null,
    name: null,
    avatarUrl: null,
  });

  const migratedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const local = getLocalUserId();
    const sb = getBrowserSupabase();

    const sync = (session: Awaited<
      ReturnType<typeof sb.auth.getSession>
    >["data"]["session"]) => {
      const user = session?.user;
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      setState({
        loading: false,
        authed: !!user,
        userId: user?.id ?? local,
        localUserId: local,
        authUserId: user?.id ?? null,
        email: user?.email ?? null,
        name:
          (meta.name as string | undefined) ??
          (meta.full_name as string | undefined) ??
          (meta.nickname as string | undefined) ??
          user?.email ??
          null,
        avatarUrl:
          (meta.avatar_url as string | undefined) ??
          (meta.picture as string | undefined) ??
          null,
      });
    };

    let initialized = false;

    sb.auth.getSession().then(({ data }) => {
      sync(data.session);
      initialized = true;
    });

    const migrate = async (authUserId: string, token: string) => {
      if (!local || local === authUserId) return;
      if (migratedRef.current.has(authUserId)) return;
      migratedRef.current.add(authUserId);
      try {
        await fetch("/api/migrate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ oldUserId: local }),
        });
      } catch {
        // ignore
      }
    };

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      sync(session);
      // Don't act on the initial session-restoration event.
      if (!initialized) return;

      if (event === "SIGNED_IN" && session?.user && session.access_token) {
        // Fire a one-time signup notification per user (dedup in localStorage).
        try {
          const key = `membar_signup_notified_${session.user.id}`;
          if (!localStorage.getItem(key)) {
            const created = session.user.created_at
              ? Date.parse(session.user.created_at)
              : 0;
            const isFreshSignup =
              !created || Date.now() - created < 10 * 60 * 1000;
            localStorage.setItem(key, "1");
            if (isFreshSignup) {
              const meta = (session.user.user_metadata ?? {}) as Record<
                string,
                unknown
              >;
              void fetch("/api/notify", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  event: "signup",
                  userId: session.user.id,
                  email: session.user.email ?? null,
                  name:
                    (meta.name as string | undefined) ??
                    (meta.full_name as string | undefined) ??
                    (meta.nickname as string | undefined) ??
                    null,
                }),
              }).catch(() => {});
              // Meta Pixel — 신규 가입 전환 이벤트
              trackPixel("CompleteRegistration", {
                content_name: "kakao_signup",
                status: "completed",
              });
            }
          }
        } catch {
          // ignore
        }
        // Migrate local data then force a full reload so every screen
        // (PaywallSheet, /me, nudges, etc.) reflects the new auth state.
        const after = () => {
          try {
            window.location.reload();
          } catch {
            // ignore
          }
        };
        migrate(session.user.id, session.access_token).finally(after);
      } else if (event === "SIGNED_OUT") {
        try {
          window.location.reload();
        } catch {
          // ignore
        }
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithKakao = useCallback(async () => {
    const sb = getBrowserSupabase();
    await sb.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = getBrowserSupabase();
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    const sb = getBrowserSupabase();
    await sb.auth.signOut();
  }, []);

  return (
    <UserContext.Provider
      value={{ ...state, signInWithKakao, signInWithGoogle, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): Ctx {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("UserProvider missing");
  return ctx;
}
