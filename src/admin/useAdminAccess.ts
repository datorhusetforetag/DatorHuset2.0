import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type AdminAccessState = {
  isAdmin: boolean;
  loading: boolean;
  error: string;
};

export type AdminAccessContext = AdminAccessState & {
  token: string;
  apiBase: string;
  refresh: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const ADMIN_CACHE_TTL_MS = 60_000;
const ADMIN_COOLDOWN_MS = 60_000;
const ADMIN_MIN_REQUEST_GAP_MS = 2_000;

let cachedToken = "";
let cachedState: AdminAccessState | null = null;
let cachedAt = 0;
let refreshPromise: Promise<AdminAccessState> | null = null;
let cooldownUntil = 0;

export const useAdminAccess = (): AdminAccessContext => {
  const { session, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [state, setState] = useState<AdminAccessState>({
    isAdmin: false,
    loading: true,
    error: "",
  });
  const refreshInFlight = useRef(false);
  const lastRequestAt = useRef(0);

  const token = session?.access_token || "";
  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE_URL || "", []);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!token) {
      cachedToken = "";
      cachedState = { isAdmin: false, loading: false, error: "" };
      cachedAt = 0;
      cooldownUntil = 0;
      setState({ isAdmin: false, loading: false, error: "" });
      return;
    }

    if (!apiBase) {
      setState({ isAdmin: false, loading: false, error: "API-bas saknas i adminmiljön." });
      return;
    }

    const now = Date.now();
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
    if (now - lastRequestAt.current < ADMIN_MIN_REQUEST_GAP_MS) return;

    refreshInFlight.current = true;
    lastRequestAt.current = now;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      refreshPromise = (async () => {
        const response = await fetch(`${apiBase}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.status === 429) {
          cooldownUntil = Date.now() + ADMIN_COOLDOWN_MS;
          return (
            cachedState || {
              isAdmin: false,
              loading: false,
              error: "För många förfrågningar. Försök igen om en liten stund.",
            }
          );
        }

        if (!response.ok || !data?.isAdmin) {
          return {
            isAdmin: false,
            loading: false,
            error: data?.error || "Du saknar behörighet för adminpanelen.",
          };
        }

        return { isAdmin: true, loading: false, error: "" };
      })();

      const nextState = await refreshPromise;
      cachedToken = token;
      cachedState = nextState;
      cachedAt = Date.now();
      setState(nextState);
    } catch (error) {
      const nextState: AdminAccessState = {
        isAdmin: false,
        loading: false,
        error: error instanceof Error ? error.message : "Kunde inte verifiera admin-åtkomst.",
      };
      cachedToken = token;
      cachedState = nextState;
      cachedAt = Date.now();
      setState(nextState);
    } finally {
      refreshInFlight.current = false;
      refreshPromise = null;
    }
  }, [apiBase, authLoading, token]);

  useEffect(() => {
    refresh();
  }, [refresh, token, authLoading]);

  return {
    ...state,
    token,
    apiBase,
    refresh,
    signInWithGoogle,
    signOut,
  };
};
