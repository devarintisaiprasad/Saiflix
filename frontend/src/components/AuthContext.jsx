import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

// Keeps the logged-in user and the chosen profile available everywhere
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => read("user"));
  const [profile, setProfile] = useState(() => read("profile"));

  const login = useCallback(({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    ["token", "user", "profile"].forEach((k) => localStorage.removeItem(k));
    setUser(null);
    setProfile(null);
  }, []);

  const selectProfile = useCallback((p) => {
    if (p) localStorage.setItem("profile", JSON.stringify(p));
    else localStorage.removeItem("profile");
    setProfile(p);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  // On start, check the saved token is still valid and refresh the role
  useEffect(() => {
    if (localStorage.getItem("token")) {
      getMe()
        .then((me) => {
          localStorage.setItem("user", JSON.stringify(me));
          setUser(me);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, selectProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
