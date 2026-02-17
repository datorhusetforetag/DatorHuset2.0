import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { startWebVitalsReporting } from "@/lib/webVitals";

startWebVitalsReporting();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
);
