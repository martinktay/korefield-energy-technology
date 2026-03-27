/**
 * Auth store — manages JWT token, user identity, login/logout.
 * Persists token in localStorage. Decodes JWT payload for user info.
 * Used by all portal layouts to get real user name/role instead of hardcoded values.
 */
import { create } from "zustand";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "learner" | "instructor" | "admin" | "super-admin" | "corporate";
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

function decodeJWT(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roleMap: Record<string, AuthUser["role"]> = {
      SuperAdmin: "super-admin",
      Admin: "admin",
      Instructor: "instructor",
      Assessor: "instructor",
      Learner: "learner",
      CorporatePartner: "corporate",
      FinanceAdmin: "admin",
      DevOpsEngineer: "admin",
    };
    return {
      id: payload.sub || payload.id || "",
      email: payload.email || "",
      name: payload.name || payload.email?.split("@")[0] || "User",
      role: roleMap[payload.role] || "learner",
      avatarUrl: payload.avatarUrl,
    };
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kf_token");
}

export const useAuthStore = create<AuthState>((set) => {
  const token = getStoredToken();
  const user = token ? decodeJWT(token) : null;

  return {
    token,
    user,
    isAuthenticated: !!user,
    login: (token: string) => {
      localStorage.setItem("kf_token", token);
      const user = decodeJWT(token);
      set({ token, user, isAuthenticated: !!user });
    },
    logout: () => {
      localStorage.removeItem("kf_token");
      set({ token: null, user: null, isAuthenticated: false });
      window.location.href = "/";
    },
    setUser: (user: AuthUser) => set({ user, isAuthenticated: true }),
  };
});
