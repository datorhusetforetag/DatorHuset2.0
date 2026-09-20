import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",

      /*
       * any är ett fel igen.
       *
       * De 36 som fanns är genomgångna: inloggningen använder Supabase
       * egen User, felobjekt narrows genom errorMessage i lib/utils,
       * och admin-API:ts svarsformer står utskrivna där de läses.
       *
       * Ett undantag står kvar, i lib/fpsSandbox.ts, med sin motivering
       * på plats: parsern för det gamla ovärsionerade FPS-formatet.
       */
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  /*
   * server.ts körs inte.
   *
   * Ingenting startar den: npm start kör server-local.js, och filen
   * importeras inte från något håll. Den är en tidigare, mycket
   * mindre version av samma backend. Den har dessutom ändringar som
   * inte är incheckade, så att typa om den nu hade blandat ihop två
   * personers arbete i samma diff.
   *
   * Undantaget är alltså tillöver tills någon bestämmer om filen ska
   * raderas eller återuppstå. Radera den och ta bort det här blocket.
   */
  {
    files: ["server.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
