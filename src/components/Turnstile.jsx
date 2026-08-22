import { useEffect, useRef, useId } from "react";

/**
 * Widget Cloudflare Turnstile — équivalent gratuit et invisible (ou quasi)
 * de reCAPTCHA, sans les problèmes de vie privée/RGPD de Google.
 *
 * Setup (une fois) :
 * 1. Crée un compte gratuit sur https://dash.cloudflare.com/?to=/:account/turnstile
 * 2. Ajoute un site, récupère la "Site Key" (publique) et la "Secret Key" (jamais côté client)
 * 3. Site Key -> variable d'env VITE_TURNSTILE_SITE_KEY côté front
 * 4. Secret Key -> variable d'env côté Supabase Edge Function UNIQUEMENT (voir verify-turnstile)
 *
 * Usage :
 *   const [captchaToken, setCaptchaToken] = useState(null);
 *   <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
 *   // Bloque le submit tant que captchaToken est null
 *   // Le token doit être revérifié côté serveur avant d'accepter le formulaire
 *   // (voir supabase/functions/verify-turnstile) — ne JAMAIS faire confiance
 *   // au fait que le widget se soit affiché comme "vert" côté client.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptLoadingPromise = null;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

export default function Turnstile({ onVerify, onExpire, onError, theme = "auto", size = "flexible" }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const domId = useId();
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    let cancelled = false;

    if (!siteKey) {
      console.error("VITE_TURNSTILE_SITE_KEY manquante — le widget Turnstile ne peut pas se charger.");
      return;
    }

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token) => onVerify?.(token),
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onError?.(),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div id={`turnstile-${domId}`} ref={containerRef} />;
}