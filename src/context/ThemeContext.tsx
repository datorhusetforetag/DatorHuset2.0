import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getPreviewThemeOverride } from "@/lib/previewMode";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/*
 * Mörkt är sajtens grundläge.
 *
 * Märket är byggt för mörk bakgrund - cyan och plommon mot märkessvart -
 * och komponentbilder läser bättre mot mörkt. Ljust läge finns kvar och
 * fungerar, men är inte längre det man möts av.
 */

/*
 * Ny nyckel med avsikt.
 *
 * Den gamla koden skrev "theme" till localStorage vid varje montering,
 * inte bara när någon faktiskt tryckte på knappen. Alla som besökt
 * sajten har därför "light" sparat utan att ha valt det, och ett nytt
 * standardläge hade aldrig nått dem. Den här nyckeln skrivs bara när
 * besökaren själv byter, så ett sparat värde betyder ett riktigt val.
 */
const THEME_STORAGE_KEY = "datorhuset-theme";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Privat läge eller blockerad lagring - kör på grundläget.
  }

  return "dark";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());
  const previewThemeOverride = getPreviewThemeOverride();
  const effectiveTheme = previewThemeOverride || theme;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.toggle("dark", effectiveTheme === "dark");
    body.classList.remove("dark");
    root.setAttribute("data-theme", effectiveTheme);
    root.style.colorScheme = effectiveTheme;
    // Skriver inte till localStorage här. Det var precis det som gjorde att
    // alla fick "light" sparat utan att ha valt det. Sparandet sker i
    // setTheme, alltså bara när besökaren själv byter.
  }, [effectiveTheme, previewThemeOverride, theme]);

  /** Byter läge och sparar valet. Enda stället som skriver till lagringen. */
  const persistTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Går lagringen inte att skriva till gäller valet ändå för sessionen.
    }
  };

  const value = useMemo(
    () => ({
      theme: effectiveTheme,
      setTheme: persistTheme,
      toggleTheme: () => persistTheme(effectiveTheme === "dark" ? "light" : "dark"),
    }),
    [effectiveTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
