import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@supabase/supabase-js";

export type AdminAccessState = {
  isAdmin: boolean;
  role: "readonly" | "ops" | "admin" | "";
  loading: boolean;
  error: string;
};

export type AdminAccessContext = AdminAccessState & {
  user: User | null;
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

const parseApiPayload = async (response: Response) => {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
};

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

    /*
     * Här låg en spärr som vägrade fråga servern när
     * VITE_API_BASE_URL saknades, med felet "API-bas saknas i
     * adminmiljön".
     *
     * Tom bas betyder inte att den saknas, den betyder samma
     * ursprung: /api/... går till den server som levererade sidan.
     * Så fungerar portalen lokalt, där Vite skickar /api vidare till
     * Express, och alla andra anrop i adminläget gör redan precis det
     * utan invändning.
     *
     * Spärren gissade alltså att ett anrop skulle misslyckas i stället
     * för att låta det misslyckas och rapportera varför. Gissningen
     * var fel, och resultatet var en portal där listningarna laddades
     * men behörigheten aldrig hämtades - alltså inga knappar, utan
     * något som pekade på den verkliga orsaken.
     *
     * Går anropet inte fram tas det om hand längre ned, där svaret
     * faktiskt finns.
     */

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

    /*
     * Strypningen fick inte lämna hooken i utgångsläget.
     *
     * Raden nedan skyddar mot att /api/admin/me anropas om och om
     * igen, vilket är rimligt. Men den returnerade tomhänt: ingen
     * setState, ingen ny försök inbokad. Blev man avvisad inom de
     * femton sekunderna stod state kvar på sitt utgångsvärde -
     * role: "", loading: true - och ingenting kom någonsin och
     * rättade det.
     *
     * Följden var en portal som såg ut att fungera men där varje
     * knapp var dold, eftersom alla behörighetsprövningar utgår från
     * role. Databasen kunde säga admin hur mycket som helst.
     *
     * Nu används det vi redan vet om vi vet något, och annars bokas
     * ett nytt försök när spärren släpper.
     */
    if (now - lastRequestAt < ADMIN_MIN_REQUEST_GAP_MS) {
      if (cachedState) {
        setState(cachedState);
        return;
      }
      const waitMs = ADMIN_MIN_REQUEST_GAP_MS - (now - lastRequestAt);
      window.setTimeout(() => {
        requestedToken.current = "";
        void refresh();
      }, waitMs + 50);
      return;
    }

    refreshInFlight.current = true;
    lastRequestAt = now;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      refreshPromise = (async () => {
        const response = await fetch(`${apiBase}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiPayload(response);

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
