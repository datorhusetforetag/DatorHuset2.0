import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Byt till ljust läge" : "Byt till mörkt läge"}
      aria-pressed={isDark}
      className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 shadow-sm transition-all hover:border-secondary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-foreground/20 dark:bg-foreground/[0.06] dark:text-foreground dark:hover:border-secondary dark:hover:text-primary"
    >
      <span className="absolute inset-0 rounded-full bg-primary/10 opacity-0 transition-opacity dark:opacity-20" />
      {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
    </button>
  );
};
