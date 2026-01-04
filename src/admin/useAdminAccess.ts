import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type AdminAccessState = {
  isAdmin: boolean;
  loading: boolean;
  error: string;
};

export const useAdminAccess = () => {
  const { session, user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [state, setState] = useState<AdminAccessState>({
    isAdmin: false,
    loading: true,
    error: "",
  });

  const token = session?.access_token || "";
  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE_URL || "", []);

  const refresh = async () => {
    if (authLoading) return;
    if (!token) {
      setState({ isAdmin: false, loading: false, error: "" });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await fetch(`${apiBase}/api/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data?.isAdmin) {
        setState({
          isAdmin: false,
          loading: false,
          error: data?.error || "Du saknar behörighet för adminpanelen.",
        });
        return;
      }
      setState({ isAdmin: true, loading: false, error: "" });
    } catch (error) {
      setState({
        isAdmin: false,
        loading: false,
        error: error instanceof Error ? error.message : "Kunde inte verifiera admin-åtkomst.",
      });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  return {
    ...state,
    token,
    user,
    apiBase,
    refresh,
    signInWithGoogle,
    signOut,
  };
};
