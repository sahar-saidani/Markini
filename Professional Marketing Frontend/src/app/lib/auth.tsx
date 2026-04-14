import { createContext, useContext, useEffect, useState } from "react";
import { fetchSession, loginUser, logoutUser, signupUser, type AuthSession } from "./api";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  login: (payload: { username: string; password: string }) => Promise<void>;
  signup: (payload: {
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    const nextSession = await fetchSession();
    setSession(nextSession);
  };

  useEffect(() => {
    refreshSession()
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload: { username: string; password: string }) => {
    const nextSession = await loginUser(payload);
    setSession(nextSession);
  };

  const signup = async (payload: {
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const nextSession = await signupUser(payload);
    setSession(nextSession);
  };

  const logout = async () => {
    await logoutUser();
    setSession({ authenticated: false });
  };

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
