import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,

    /*
     * /api vidare till Express.
     *
     * I drift ligger bada bakom samma adress: server-local.js serverar
     * bade dist/ och /api, sa en relativ sokvag traffar ratt av sig
     * sjalv. I utvecklingslage finns bara Vite pa 8080, och ett POST
     * till /api/... blev en 404 fran Vite - inte fran servern, utan
     * for att servern inte var inblandad alls.
     *
     * Det drabbade allt som pratar med backenden: kontaktformularet,
     * serviceformularet, offertforfragan, sidinstallningarna och
     * adminlaget. De sag ut att vara trasiga fast de aldrig kom fram.
     *
     * Med proxyn racker det att kora `npm run serve:dev` i ett andra
     * fonster. Andrar man PORT far man satta VITE_API_PROXY darefter.
     */
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
