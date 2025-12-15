import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AuthApi } from "@/services/admin";
import { setAuthToken, clearAuthToken, getAuthToken } from "@/services/http";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (username: string, password: string) => {
    try {
      const res = await AuthApi.adminLogin({ username, password });
      
      // Handle business error where HTTP status is 200 but success is false
      if (res.success === false) {
        toast.error(res.message || res.msg || "登录失败，请检查用户名或密码");
        return false;
      }

      if (res.data?.token) {
        setIsAuthenticated(true);
        setAuthToken(res.data.token);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login failed:", error);
      const msg = error.message || "登录失败，请检查用户名或密码";
      toast.error(msg);
      return false;
    }
  };

  const logout = async () => {
    try {
        await AuthApi.logout();
    } catch (e) {
        // ignore
    }
    setIsAuthenticated(false);
    clearAuthToken();
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Ideally verify token validity here or handle 401 in http interceptor
      setIsAuthenticated(true);
    }
  }, []);

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
