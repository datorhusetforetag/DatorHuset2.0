import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Reset your password
          </p>
          <h1 className="text-2xl font-bold mt-3">Skapa ett nytt losenord</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Valt losenord uppdateras direkt nar du sparar.
          </p>

          {!sessionReady && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-6">Verifierar lank...</p>
          )}

          {sessionReady && !hasSession && (
            <div className="mt-6 text-sm text-gray-600 dark:text-gray-300 space-y-3">
              <p>Den har lankens session har gatt ut.</p>
              <Link to="/account" className="text-[#11667b] font-semibold hover:text-[#0d4d5d]">
                Be om en ny losenordslank
              </Link>
            </div>
          )}

          {sessionReady && hasSession && (
            <div className="mt-6 space-y-4">
              <label className="text-xs text-gray-600 dark:text-gray-300">
                Nytt losenord
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600 dark:text-gray-300">
                Upprepa losenord
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
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
                className="w-full mt-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white disabled:opacity-60 transition-colors"
              >
                {status === "saving" ? "Sparar..." : "Spara nytt losenord"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
