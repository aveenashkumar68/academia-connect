import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {}
});
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({
  children
}) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        setSession({
          access_token: u.token
        });
        setRole(u.role);
      } catch (e) {
        console.error("Invalid user JSON in localStorage");
      }
    }
    setLoading(false);
  }, []);
  const signOut = async () => {
    localStorage.removeItem("user");
    setUser(null);
    setSession(null);
    setRole(null);
    // Note: To navigate on sign out, the component triggering it might handle the redirect,
    // or you can rely on protected routes redirecting unauthenticated users.
    window.location.href = "/";
  };
  return <AuthContext.Provider value={{
    user,
    session,
    role,
    loading,
    signOut
  }}>
      {children}
    </AuthContext.Provider>;
}