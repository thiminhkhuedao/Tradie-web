// src/lib/security.js
//
// Helper partagé pour vérifier rate limiting + captcha + honeypot avant
// toute action publique sensible (contact, booking, signup...).
// Utilisé par ContactPage, PublicBookingPage, et AuthPage.
//
// Requiert la variable d'env VITE_SUPABASE_URL (déjà utilisée ailleurs
// dans le projet pour initialiser le client Supabase).

/**
 * @param {string} action - doit correspondre à une clé de LIMITS dans
 *   supabase/functions/check-rate-limit/index.ts (ex: "contact_form",
 *   "booking_request", "login", "signup")
 * @param {object} opts
 * @param {string} [opts.identifier] - email ou autre identifiant à limiter en plus de l'IP
 * @param {string} [opts.turnstileToken] - token du widget Turnstile, requis pour signup/contact_form/booking_request
 * @param {string} [opts.honeypot] - valeur du champ honeypot, vide si humain
 * @returns {Promise<string|null>} - null si autorisé, sinon un message d'erreur à afficher
 */
export async function checkRateLimit(action, { identifier, turnstileToken, honeypot } = {}) {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, identifier, turnstileToken, honeypot }),
    });
    const data = await res.json();
    if (!data.allowed) {
      switch (data.reason) {
        case "rate_limited_ip":
        case "rate_limited_identifier":
          return "Too many attempts. Please wait a few minutes and try again.";
        case "captcha_failed":
          return "Verification failed. Please try the challenge again.";
        case "bot_detected":
          // Message générique volontairement — ne pas donner d'indice au bot
          return "Something went wrong. Please try again.";
        default:
          return "Something went wrong. Please try again.";
      }
    }
    return null;
  } catch {
    // En cas de panne réseau/infra sur l'Edge Function, on laisse passer
    // plutôt que de bloquer tout le monde — mieux vaut un peu de spam
    // occasionnel qu'un formulaire de contact cassé pour de vrais clients.
    return null;
  }
}