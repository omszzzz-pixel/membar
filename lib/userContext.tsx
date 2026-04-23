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

    sb.auth.getSession().then(({ data }) => sync(data.session));

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
      if (event === "SIGNED_IN" && session?.user && session.access_token) {
        void migrate(session.user.id, session.access_token);
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
      options: {
        redirectTo: window.location.origin,
        // 이메일(account_email) scope는 Kakao 비즈 인증 필요 → 제외.
        // 닉네임 + 프로필 사진만 요청.
        scopes: "profile_nickname profile_image",
      },
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
