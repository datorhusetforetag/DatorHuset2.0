import { PageShell } from "@/components/PageShell";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type ResetStatus = "idle" | "saving" | "saved" | "error";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<ResetStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setHasSession(Boolean(data.session));
      setSessionReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });
    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    setErrorMessage("");
    if (password.length < 8) {
      setErrorMessage("Losentordet maste vara minst 8 tecken.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Losentorden matchar inte.");
      return;
    }
    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message || "Kunde inte uppdatera losenordet.");
      return;
    }
    setStatus("saved");
    setTimeout(() => navigate("/account"), 2000);
  };

  return (
    <PageShell>
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto rounded-2xl border border-foreground/10 bg-background/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Reset your password
          </p>
          <h1 className="text-2xl font-bold mt-3">Skapa ett nytt losenord</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Valt losenord uppdateras direkt nar du sparar.
          </p>

          {!sessionReady && (
            <p className="text-sm text-muted-foreground mt-6">Verifierar lank...</p>
          )}

          {sessionReady && !hasSession && (
            <div className="mt-6 text-sm text-muted-foreground space-y-3">
              <p>Den har lankens session har gatt ut.</p>
              <Link to="/account" className="text-primary font-semibold hover:text-secondary">
                Be om en ny losenordslank
              </Link>
            </div>
          )}

          {sessionReady && hasSession && (
            <div className="mt-6 space-y-4">
              <label className="text-xs text-muted-foreground">
                Nytt losenord
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-foreground/10 bg-background/70 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Upprepa losenord
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-foreground/10 bg-background/70 px-3 py-2 text-sm"
                />
              </label>

              {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
              {status === "saved" && (
                <p className="text-xs text-green-600">Losenord uppdaterat. Tar dig tillbaka...</p>
              )}
              {status === "error" && !errorMessage && (
                <p className="text-xs text-red-500">Kunde inte uppdatera losenordet.</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "saving"}
                className="w-full mt-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-secondary hover:text-white disabled:opacity-60 transition-colors"
              >
                {status === "saving" ? "Sparar..." : "Spara nytt losenord"}
              </button>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
