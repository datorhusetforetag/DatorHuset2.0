import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { decodeUnicodeEscapes } from "@/lib/textUtils";

export function LoginButton() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resendSignupEmail, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [lastSignupEmail, setLastSignupEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-gray-600 text-sm dark:text-gray-300">Laddar...</div>;
  }

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
    setLastSignupEmail(null);
    setError(null);
    setSuccessMessage(null);
    setPending(false);
    setResendPending(false);
    setResendCooldown(0);
    setMode("login");
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleEmailLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setPending(true);
    try {
      await signInWithEmail(email, password);
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Kunde inte logga in.");
    } finally {
      setPending(false);
    }
  };

  const handleSignup = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!username.trim()) {
      setError("Ange ett användarnamn.");
      return;
    }
    setPending(true);
    try {
      await signUpWithEmail(email, password, username.trim());
      setPassword("");
      setUsername("");
      setLastSignupEmail(email);
      setResendCooldown(60);
      setMode("login");
      setSuccessMessage("Konto skapat! Kontrollera din e-post och bekräfta kontot innan du loggar in.");
    } catch (err: any) {
      setError(err?.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  };

  const handleResendVerification = async () => {
    if (!lastSignupEmail || resendCooldown > 0) return;
    setResendPending(true);
    setError(null);
    try {
      await resendSignupEmail(lastSignupEmail);
      setResendCooldown(60);
      setSuccessMessage("Verifieringsmejlet skickades igen. Kolla inkorgen.");
    } catch (err: any) {
      setError(err?.message || "Kunde inte skicka verifieringsmejl.");
    } finally {
      setResendPending(false);
    }
  };

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const displayName =
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Profil";
    const ordersLabel = decodeUnicodeEscapes("Mina beställningar");
    const initials = displayName.trim().charAt(0).toUpperCase() || "P";

    return (
      <div className="relative z-50">
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt="Profil" />
            <AvatarFallback className="bg-yellow-400 text-gray-900 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Inloggad som</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{displayName}</p>
            </div>
            <button
              onClick={() => {
                setShowDropdown(false);
                navigate("/account");
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-900 font-semibold transition-colors dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Mina uppgifter
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                navigate("/orders");
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-900 font-semibold transition-colors dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {ordersLabel}
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                signOut();
              }}
              className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold transition-colors dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4" />
              Logga ut
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) resetForm();
    }}>
      <SheetTrigger asChild>
        <button className="px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2 md:text-base rounded-lg bg-yellow-400 text-gray-900 font-semibold leading-none shadow-sm hover:bg-[#11667b] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2">
          Logga in
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md lg:w-[33vw] lg:max-w-[33vw] bg-white dark:bg-[#0f1824]">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <img
              src="/Datorhuset.png"
              alt="DatorHuset"
              className="w-10 h-10 object-contain"
              loading="lazy"
              decoding="async"
            />
            <div>
              <SheetTitle className="text-xl">Logga in på DatorHuset</SheetTitle>
              <SheetDescription>Hantera ordrar, favoriter och serviceärenden.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <button
            onClick={async () => {
              setError(null);
              setPending(true);
              try {
                await signInWithGoogle();
              } catch (err: any) {
                setError(err?.message || "Google-inloggning misslyckades.");
              } finally {
                setPending(false);
              }
            }}
            className="w-full py-3 rounded-lg border border-[#23324a] bg-[#101a28] text-white font-semibold shadow-sm hover:bg-[#162235] hover:border-[#2b3d59] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={pending}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5 6.9 2.5 2.7 6.7 2.7 12s4.2 9.5 9.3 9.5c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.6H12z"
              />
              <path
                fill="#34A853"
                d="M3.8 7.3l3.1 2.3C7.7 7.7 9.6 6.1 12 6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5c-3.6 0-6.6 2.1-8.2 4.8z"
              />
              <path
                fill="#FBBC05"
                d="M12 21.5c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 1-3.3 1-2.4 0-4.5-1.6-5.2-3.7l-3.1 2.4c1.6 2.8 4.6 5.1 8.3 5.1z"
              />
              <path
                fill="#4285F4"
                d="M21 12.4c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.6-1.9 3-3.4 3.7l3.1 2.4c1.8-1.7 2.8-4.2 2.8-7.4z"
              />
            </svg>
            Logga in via Google
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            eller med e-post
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${mode === "login" ? "border-emerald-500 text-emerald-600" : "border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300"}`}
            >
              Logga in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${mode === "signup" ? "border-emerald-500 text-emerald-600" : "border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300"}`}
            >
              Skapa konto
            </button>
          </div>

          {mode === "signup" && (
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Användarnamn
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2">
                <User className="w-4 h-4 text-gray-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex. DatorHuset"
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </label>
          )}

          <label className="block text-sm text-gray-700 dark:text-gray-300">
            E-post
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@mail.se"
                className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </label>

          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Lösenord
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 6 tecken"
                className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div>{successMessage}</div>
              {lastSignupEmail && mode === "login" && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-600 disabled:text-emerald-400"
                  disabled={resendPending || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Skicka igen om ${resendCooldown}s`
                    : resendPending
                      ? "Skickar..."
                      : "Skicka verifieringsmejl igen"}
                </button>
              )}
            </div>
          )}

          {mode === "login" ? (
            <button
              onClick={handleEmailLogin}
              className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
              disabled={pending}
            >
              Logga in med e-post
            </button>
          ) : (
            <button
              onClick={handleSignup}
              className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
              disabled={pending}
            >
              Skapa konto
            </button>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {mode === "login" ? "Saknar konto? Skapa ett konto för att spara ordrar." : "Har du redan konto? Logga in ovan."}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
