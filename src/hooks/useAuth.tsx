import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type AppRole = "admin" | "presenter" | "player";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  displayName: string;
  isAdmin: boolean;
  isPresenter: boolean;
  isStaff: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    roles: [],
    displayName: "",
    isAdmin: false,
    isPresenter: false,
    isStaff: false,
  });

  const hydrate = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({
        loading: false,
        session: null,
        user: null,
        roles: [],
        displayName: "",
        isAdmin: false,
        isPresenter: false,
        isStaff: false,
      });
      return;
    }
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      supabase.from("profiles").select("display_name").eq("id", session.user.id).maybeSingle(),
    ]);
    const roles = ((roleRows ?? []).map((r) => r.role) as AppRole[]).filter(Boolean);
    const isAdmin = roles.includes("admin");
    const isPresenter = roles.includes("presenter");
    setState({
      loading: false,
      session,
      user: session.user,
      roles: roles.length > 0 ? roles : ["player"],
      displayName: profile?.display_name ?? session.user.email ?? "Player",
      isAdmin,
      isPresenter,
      isStaff: isAdmin || isPresenter,
    });
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrate(session);
    });
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  return state;
}

export async function signInWithGoogle() {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
