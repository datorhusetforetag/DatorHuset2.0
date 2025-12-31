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
      className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 shadow-sm transition-all hover:border-[#11667b] hover:text-[#11667b] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:text-[#11667b]"
    >
      <span className="absolute inset-0 rounded-full bg-yellow-400/10 opacity-0 transition-opacity dark:opacity-20" />
      {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
    </button>
  );
};
