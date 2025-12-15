import { createContext, useContext, useState, ReactNode } from "react";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/services/http";
import { AuthApi } from "@/services/admin";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const flag = localStorage.getItem("auth") === "true";
    const token = getAuthToken();
    return flag || !!token;
  });

  const login = (username: string, password: string) => {
    return AuthApi.adminLogin({ username, password })
      .then((res) => {
        const token = (res as unknown as { data?: { token?: string } }).data?.token || "";
        if (token) {
          setAuthToken(token);
          setIsAuthenticated(true);
          localStorage.setItem("auth", "true");
          return true;
        }
        return false;
      })
      .catch(() => false);
  };

  const logout = () => {
    try {
      AuthApi.logout();
    } catch {}
    setIsAuthenticated(false);
    localStorage.removeItem("auth");
    clearAuthToken();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
