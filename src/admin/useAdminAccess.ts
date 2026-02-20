import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type AdminAccessState = {
  isAdmin: boolean;
  role: "readonly" | "ops" | "admin" | "";
  loading: boolean;
  error: string;
};

export type AdminAccessContext = AdminAccessState & {
  user: any;
  token: string;
  apiBase: string;
  refresh: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const ADMIN_CACHE_TTL_MS = 5 * 60_000;
const ADMIN_COOLDOWN_MS = 2 * 60_000;
const ADMIN_MIN_REQUEST_GAP_MS = 15_000;

let cachedToken = "";
let cachedState: AdminAccessState | null = null;
let cachedAt = 0;
let refreshPromise: Promise<AdminAccessState> | null = null;
let cooldownUntil = 0;
let lastRequestAt = 0;
let lastVerifiedToken = "";
let lastVerifiedAt = 0;

export const useAdminAccess = (): AdminAccessContext => {
  const { session, user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [state, setState] = useState<AdminAccessState>({
    isAdmin: false,
    role: "",
    loading: true,
    error: "",
  });
  const refreshInFlight = useRef(false);
  const requestedToken = useRef("");

  const token = session?.access_token || "";
  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE_URL || "", []);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!token) {
      cachedToken = "";
      cachedState = { isAdmin: false, role: "", loading: false, error: "" };
      cachedAt = 0;
      cooldownUntil = 0;
      lastVerifiedToken = "";
      lastVerifiedAt = 0;
      setState({ isAdmin: false, role: "", loading: false, error: "" });
      return;
    }

    if (!apiBase) {
      setState({ isAdmin: false, role: "", loading: false, error: "API-bas saknas i adminmiljön." });
      return;
    }

    const now = Date.now();
    if (lastVerifiedToken === token && now - lastVerifiedAt < ADMIN_CACHE_TTL_MS && cachedState) {
      setState(cachedState);
      return;
    }
    if (cooldownUntil && now < cooldownUntil && cachedState) {
      setState(cachedState);
      return;
    }
    if (cachedState && cachedToken === token && now - cachedAt < ADMIN_CACHE_TTL_MS) {
      setState(cachedState);
      return;
    }
    if (refreshPromise) {
      const result = await refreshPromise;
      setState(result);
      return;
    }
    if (refreshInFlight.current) return;
    if (now - lastRequestAt < ADMIN_MIN_REQUEST_GAP_MS) return;

    refreshInFlight.current = true;
    lastRequestAt = now;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      refreshPromise = (async () => {
        const response = await fetch(`${apiBase}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After") || 0);
          cooldownUntil = Date.now() + (retryAfter > 0 ? retryAfter * 1000 : ADMIN_COOLDOWN_MS);
          return (
            cachedState || {
              isAdmin: false,
              role: "",
              loading: false,
              error: "För många förfrågningar. Försök igen om en liten stund.",
            }
          );
        }

        if (!response.ok || !data?.isAdmin) {
          return {
            isAdmin: false,
            role: "",
            loading: false,
            error: data?.error || "Du saknar behörighet för adminpanelen.",
          };
        }

        const role = data?.role === "readonly" || data?.role === "ops" || data?.role === "admin"
          ? data.role
          : "admin";
        return { isAdmin: true, role, loading: false, error: "" };
      })();

      const nextState = await refreshPromise;
      cachedToken = token;
      cachedState = nextState;
      cachedAt = Date.now();
      lastVerifiedToken = token;
      lastVerifiedAt = cachedAt;
      setState(nextState);
    } catch (error) {
      const nextState: AdminAccessState = {
        isAdmin: false,
        role: "",
        loading: false,
        error: error instanceof Error ? error.message : "Kunde inte verifiera admin-åtkomst.",
      };
      cachedToken = token;
      cachedState = nextState;
      cachedAt = Date.now();
      lastVerifiedToken = token;
      lastVerifiedAt = cachedAt;
      setState(nextState);
    } finally {
      refreshInFlight.current = false;
      refreshPromise = null;
    }
  }, [apiBase, authLoading, token]);

  useEffect(() => {
    if (!token || authLoading) return;
    if (requestedToken.current === token && cachedState) {
      setState(cachedState);
      return;
    }
    requestedToken.current = token;
    refresh();
  }, [refresh, token, authLoading]);

  return {
    ...state,
    user,
    token,
    apiBase,
    refresh,
    signInWithGoogle,
    signOut,
  };
};
