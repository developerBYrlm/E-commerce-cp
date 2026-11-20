import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    api.get("/auth/me").then(({ data }) => { if (active) setUser(data.user); })
      .catch((error) => { if (error.status !== 401) console.error("Unable to restore the saved session:", error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const authenticate = useCallback(async (endpoint, values) => {
    const { data } = await api.post(endpoint, values);
    setUser(data.user);
    return data.user;
  }, []);
  const login = useCallback((values) => authenticate("/auth/login", values), [authenticate]);
  const googleLogin = useCallback((credential) => authenticate("/auth/google", credential), [authenticate]);
  const register = useCallback(async (values) => {
    const { data } = await api.post("/auth/register", values);
    return data;
  }, []);
  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
    queryClient.clear();
  }, [queryClient]);
  const updateProfile = useCallback(async (values) => {
    const { data } = await api.patch("/users/me", values);
    setUser(data.user);
    return data.user;
  }, []);
  const followShop = useCallback(async (shopId) => {
    const { data } = await api.put(`/users/follow/${shopId}`);
    setUser((current) => current ? {
      ...current,
      following: data.following
        ? [...new Set([...(current.following || []).map(String), shopId])]
        : (current.following || []).filter((id) => String(id) !== shopId),
    } : current);
    return data;
  }, []);
  const followService = useCallback(async (serviceId) => {
    const { data } = await api.put(`/users/follow-service/${serviceId}`);
    setUser((current) => current ? {
      ...current,
      followingServices: data.following
        ? [...new Set([...(current.followingServices || []).map(String), serviceId])]
        : (current.followingServices || []).filter((id) => String(id) !== serviceId),
    } : current);
    return data;
  }, []);
  const toggleWishlist = useCallback(async (productId) => {
    const { data } = await api.put(`/users/wishlist/${productId}`);
    setUser((current) => current ? {
      ...current,
      wishlist: data.saved
        ? [...new Set([...(current.wishlist || []).map(String), productId])]
        : (current.wishlist || []).filter((id) => String(id) !== productId),
    } : current);
    return data.saved;
  }, []);

  return <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading, updateProfile, followShop, followService, toggleWishlist }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
