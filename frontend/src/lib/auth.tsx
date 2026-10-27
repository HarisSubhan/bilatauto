import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
type User = { id: string; email: string };
type Session = { access_token: string; user: User };
import { db } from "@/lib/db";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export type Profile = {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  phone: string | null;
  status: string;
  is_verified: boolean;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let generation = 0;

    const loadExtras = async (userId: string) => {
      const request = ++generation;
      const [{ data: p }, { data: r }] = await Promise.all([
        db.from("profiles").select("*").eq("id", userId).maybeSingle(),
        db.from("user_roles").select("roles(slug)").eq("user_id", userId),
      ]);
      if (!active || request !== generation) return;
      setProfile((p as Profile | null) ?? null);
      const slugs = ((r ?? []) as Array<{ roles: { slug: string } | null }>)
        .map((row) => row.roles?.slug)
        .filter((s): s is string => Boolean(s));
      setRoles(slugs);
    };

    const { data: sub } = db.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadExtras(nextSession.user.id);
      } else {
        generation++;
        setProfile(null);
        setRoles([]);
      }
    });

    void db.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) void loadExtras(data.session.user.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      roles,
      loading,
      isSuperAdmin: roles.includes("super_admin") || roles.includes("admin"),
      signOut: async () => {
        setSession(null);
        setProfile(null);
        setRoles([]);
        await db.auth.signOut();
        await queryClient.cancelQueries();
        queryClient.clear();
        await router.navigate({to:"/auth",replace:true});
        await router.invalidate();
      },
    }),
    [session, profile, roles, loading, router, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
