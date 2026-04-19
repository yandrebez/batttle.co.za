import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

const AUTH_KEY = "battle_auth_token";
const USER_KEY = "battle_auth_user";
const AUTH_CHANGED_EVENT = "battle-auth-changed";

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userJson = window.localStorage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson) as AuthUser;
  } catch {
    return null;
  }
}

function notifyAuthChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncUserFromStorage = () => {
      setUser(readStoredUser());
    };

    syncUserFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (event.key === USER_KEY || event.key === AUTH_KEY || event.key === null) {
        syncUserFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, syncUserFromStorage);

    setIsLoading(false);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUserFromStorage);
    };
  }, []);

  const register = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = (await response.json()) as {
          token?: string;
          user?: AuthUser;
          message?: string;
        };

        if (!response.ok) {
          return { success: false, message: data.message || "Registration failed" };
        }

        if (data.token && data.user) {
          window.localStorage.setItem(AUTH_KEY, data.token);
          window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setUser(data.user);
          notifyAuthChanged();
          return { success: true };
        }

        return { success: false, message: "No token received" };
      } catch (error) {
        return { success: false, message: String(error) };
      }
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = (await response.json()) as {
          token?: string;
          user?: AuthUser;
          message?: string;
        };

        if (!response.ok) {
          return { success: false, message: data.message || "Login failed" };
        }

        if (data.token && data.user) {
          window.localStorage.setItem(AUTH_KEY, data.token);
          window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setUser(data.user);
          notifyAuthChanged();
          return { success: true };
        }

        return { success: false, message: "No token received" };
      } catch (error) {
        return { success: false, message: String(error) };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    notifyAuthChanged();
  }, []);

  return { user, isLoading, register, login, logout };
}
