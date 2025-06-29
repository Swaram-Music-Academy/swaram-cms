import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LoadingPage from "@/pages/LoadingPage";
import { Session } from "@supabase/supabase-js";
import { Tables } from "@/lib/api/types";

type User = Tables<"users">;

const SessionContext = createContext<{
  session: Session | null;
  user: User | null;
}>({
  session: null,
  user: null,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

type Props = { children: React.ReactNode };
export default function SessionProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async (uid: string) => {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("id", uid)
        .limit(1)
        .single();

      if (error) console.error(error);
      setUser(data);
    };

    const authStateListener = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user.id) {
          fetchUser(session.user.id);
        }
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  return (
    <SessionContext.Provider value={{ session, user }}>
      {isLoading ? (
        <div className="h-screen w-screen grid place-items-center">
          <LoadingPage />
        </div>
      ) : (
        children
      )}
    </SessionContext.Provider>
  );
}
