// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/globals.css";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

async function bootstrap() {
  const { default: App } = await import("./App.jsx");
  const { default: PublicBookingPage } = await import("./pages/PublicBookingPage.jsx");

  const routedApp = (
    <BrowserRouter>
      <Routes>
        <Route path="/b/:slug" element={<PublicBookingPage />} />
        <Route path="*" element={<App useClerk={!!CLERK_KEY} />} />
      </Routes>
    </BrowserRouter>
  );

  if (CLERK_KEY) {
    const { ClerkProvider } = await import("@clerk/clerk-react");
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <ClerkProvider publishableKey={CLERK_KEY}>
          {routedApp}
        </ClerkProvider>
      </React.StrictMode>
    );
  } else {
    console.info("[Vimen] Running in demo mode. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local for real auth.");
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        {routedApp}
      </React.StrictMode>
    );
  }
}

bootstrap().catch(err => {
  document.getElementById("root").innerHTML = `
    <div style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
      <h2 style="color:#E8500A">⚡ Vimen — startup error</h2>
      <p style="color:#666;margin:12px 0">Something went wrong loading the app:</p>
      <pre style="background:#f5f5f5;padding:16px;border-radius:8px;overflow:auto;font-size:13px">${err.message}</pre>
      <p style="color:#666;margin-top:16px">
        Check the browser console (F12) for more details.<br/>
        Most likely: missing or wrong <code>.env.local</code> keys.
      </p>
    </div>
  `;
});
