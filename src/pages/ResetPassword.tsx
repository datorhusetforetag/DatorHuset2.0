import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { supabase } from "@/lib/supabaseClient";

/**
 * Nytt lösenord.
 *
 * Sidan hade tre problem utöver formen. Ögonbrynet stod på engelska
 * ("Reset your password") mitt i en svensk butik. Alla å, ä och ö
 * saknades - "Losentordet maste vara minst 8 tecken", "Den har lankens
 * session har gatt ut" - vilket dessutom dolde ett stavfel:
 * "Losentordet" skulle vara "Lösenordet". Och fälten låg lösa utan
 * form, så Enter gjorde ingenting; man var tvungen att sikta på
 * knappen.
 *
 * Allt tre är rättat. Fälten ligger i ett riktigt formulär med
 * autocomplete="new-password", så lösenordshanterare förstår vad de
 * ser, och besked om fel läses upp av skärmläsare i stället för att
 * bara dyka upp.
 */

const ACCENT = PAGE_BANNERS.account.accent;

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setStatus("error");
      setErrorMessage("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Lösenorden matchar inte.");
      return;
    }

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message || "Kunde inte uppdatera lösenordet.");
      return;
    }

    setStatus("saved");
    setTimeout(() => navigate("/account"), 2000);
  };

  return (
    <PageShell>
      <PageHero
        compact
        accent={ACCENT}
        sandboxId="reset-hero"
        breadcrumb={[
          { label: "Hem", href: "/" },
          { label: "Mitt konto", href: "/account" },
          { label: "Nytt lösenord" },
        ]}
        eyebrow="Mitt konto"
        title="Skapa ett nytt lösenord"
        lede="Det nya lösenordet gäller direkt när du sparar."
      />

      <section data-sandbox-id="reset-body" className="relative">
        <div className="container mx-auto max-w-lg px-4 pb-24 pt-12">
          <Reveal className="rounded-lg border border-foreground/10 bg-background/70 p-7 sm:p-8">
            {!sessionReady && (
              <p className="text-sm text-muted-foreground">Verifierar länken...</p>
            )}

            {sessionReady && !hasSession && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Länken har gått ut
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Återställningslänkar är tillfälliga av säkerhetsskäl. Be om en
                  ny så skickar vi en färsk.
                </p>
                <Link to="/account" className="btn-primary mt-2 w-full">
                  Be om en ny länk
                </Link>
              </div>
            )}

            {sessionReady && hasSession && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="reset-password">
                    Nytt lösenord
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="field"
                  />
                  <p className="text-xs text-muted-foreground">Minst 8 tecken.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="reset-confirm">
                    Upprepa lösenord
                  </label>
                  <input
                    id="reset-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="field"
                  />
                </div>

                {errorMessage && (
                  <p role="alert" className="text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
                {status === "saved" && (
                  <p role="status" className="text-sm" style={{ color: ACCENT }}>
                    Lösenordet är uppdaterat. Tar dig tillbaka till kontot...
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "saving" ? "Sparar..." : "Spara nytt lösenord"}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
