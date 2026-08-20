// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "../context/AppContext.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./styles/globals.css";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

async function bootstrap() {
  const { default: App } = await import("./App.jsx");
  const { default: PublicBookingPage } = await import("./pages/PublicBookingPage.jsx");
  const { default: PublicQuotePage } = await import("./pages/PublicQuotePage.jsx");

  // Chargé seulement si Clerk est configuré — nécessaire pour la route
  // /sso-callback qui finalise la connexion Google (et tout autre OAuth).
  let AuthenticateWithRedirectCallback = null;
  let ClerkProvider = null;
  if (CLERK_KEY) {
    const clerkReact = await import("@clerk/clerk-react");
    ClerkProvider = clerkReact.ClerkProvider;
    AuthenticateWithRedirectCallback = clerkReact.AuthenticateWithRedirectCallback;
  }

  // Wrap the routes inside AppProvider here — ErrorBoundary en tout premier
  // pour attraper n'importe quel crash de rendu, n'importe où dans l'app,
  // et afficher un message générique plutôt qu'une page blanche.
  const routedApp = (
    <ErrorBoundary fullPage>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/b/:slug" element={<PublicBookingPage />} />
            <Route path="/quote/:token" element={<PublicQuotePage />} />
            {AuthenticateWithRedirectCallback && (
              <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
            )}
            <Route path="*" element={<App useClerk={!!CLERK_KEY} />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );

  const root = ReactDOM.createRoot(document.getElementById("root"));

  if (CLERK_KEY && ClerkProvider) {
    root.render(
      <React.StrictMode>
        <ClerkProvider publishableKey={CLERK_KEY}>
          {routedApp}
        </ClerkProvider>
      </React.StrictMode>
    );
  } else {
    console.info(
      "[Vimen] Running in demo mode. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local for real auth."
    );
    root.render(
      <React.StrictMode>
        {routedApp}
      </React.StrictMode>
    );
  }
}

bootstrap().catch((err) => {
  // Détail complet en console pour toi — jamais montré à l'utilisateur.
  console.error("[Vimen] Startup error:", err);

  const fr = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr");
  document.getElementById("root").innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,sans-serif;background:#F5F4F1">
      <div style="text-align:center;max-width:420px">
        <div style="font-size:40px;margin-bottom:16px">⚠️</div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px;color:#131211">
          ${fr ? "Oups, une erreur est survenue" : "Oops, something went wrong"}
        </h2>
        <p style="color:#666;margin:0 0 24px;font-size:14px;line-height:1.6">
          ${fr
            ? "Le problème a été enregistré. Essaie de recharger la page — si ça persiste, contacte le support."
            : "The issue has been logged. Try reloading the page — if it persists, contact support."}
        </p>
        <button onclick="window.location.reload()" style="padding:10px 24px;border-radius:8px;border:none;background:#E8500A;color:#fff;cursor:pointer;font-size:14px;font-weight:700">
          ${fr ? "Recharger la page" : "Reload page"}
        </button>
      </div>
    </div>
  `;
});
