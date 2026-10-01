import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  const logout = () => {
    sessionStorage.removeItem("foodie_token");
    setUser(null);
  };
  useEffect(() => {
    if (sessionStorage.getItem("foodie_token"))
      api("/auth/me")
        .then(setUser)
        .catch(logout)
        .finally(() => setLoading(false));
    else setLoading(false);
    window.addEventListener("auth-expired", logout);
    return () => window.removeEventListener("auth-expired", logout);
  }, []);
  async function authenticate(mode, body) {
    const result = await api(`/auth/${mode}`, { method: "POST", body });
    sessionStorage.setItem("foodie_token", result.access_token);
    setUser(result.user);
    return result.user;
  }
  return (
    <AuthContext.Provider value={{ user, loading, logout, authenticate }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
