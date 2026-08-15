import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { registerForPush, wireNotificationTaps } from "./notifications";

interface SessionState {
  session: Session | null;
  loading: boolean;
  onboarded: boolean | null; // null = unknown/loading
  refreshOnboarded: () => Promise<void>;
}

const Ctx = createContext<SessionState>({
  session: null, loading: true, onboarded: null, refreshOnboarded: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  async function loadOnboarded(s: Session | null) {
    if (!s) { setOnboarded(null); return; }
    const { data } = await supabase
      .from("profiles").select("onboarded").eq("id", s.user.id).maybeSingle();
    setOnboarded(Boolean(data?.onboarded));
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadOnboarded(data.session);
      setLoading(false);
      if (data.session) registerForPush(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      await loadOnboarded(s);
      setLoading(false);
      if (s) registerForPush(s.user.id);
    });
    // Tapping a notification routes to the screen the server named.
    const unwire = wireNotificationTaps();
    return () => { sub.subscription.unsubscribe(); unwire(); };
  }, []);

  return (
    <Ctx.Provider value={{ session, loading, onboarded, refreshOnboarded: () => loadOnboarded(session) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
