import { useState, useEffect } from "react";

/**
 * Bandeau de consentement cookies conforme CNIL.
 *
 * Règles CNIL respectées :
 * - Rien n'est déposé avant consentement (sauf cookies strictement nécessaires)
 * - "Tout refuser" est aussi facile d'accès que "Tout accepter" (même niveau, même taille)
 * - Aucune case pré-cochée sauf les cookies essentiels (non désactivables)
 * - Choix granulaire par finalité (pas juste accepter/refuser en bloc)
 * - Le consentement est révocable à tout moment (bouton "Gérer les cookies" en footer)
 * - Le consentement expire et doit être redemandé (13 mois, recommandation CNIL)
 *
 * Composant à placer dans src/components/CookieConsent.jsx
 *
 * Intégration :
 * 1. Place <CookieConsent /> juste avant la fermeture de <body> / à la racine de App.jsx
 * 2. Avant de charger analytics/marketing (ex: Google Analytics, Meta Pixel), vérifie
 *    la valeur retournée par getConsent() — ne charge le script QUE si consenti === true
 * 3. Ajoute un lien "Gérer les cookies" dans ton footer qui appelle openCookieSettings()
 */

const CONSENT_KEY = "vimen_cookie_consent";
const CONSENT_VERSION = "1.0";
const CONSENT_DURATION_DAYS = 395; // ~13 mois, recommandation CNIL

const CATEGORIES = [
  {
    id: "necessary",
    label: "Cookies strictement nécessaires",
    description:
      "Indispensables au fonctionnement du site (connexion, panier, sécurité). Ne peuvent pas être désactivés.",
    locked: true,
  },
  {
    id: "analytics",
    label: "Mesure d'audience",
    description:
      "Nous aident à comprendre comment le site est utilisé, pour l'améliorer (ex: pages visitées, temps passé).",
    locked: false,
  },
  {
    id: "marketing",
    label: "Publicité & personnalisation",
    description:
      "Utilisés pour vous proposer des contenus ou publicités pertinents sur Tradie et ailleurs.",
    locked: false,
  },
];

function getStoredConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    const expiry = new Date(parsed.timestamp);
    expiry.setDate(expiry.getDate() + CONSENT_DURATION_DAYS);
    if (new Date() > expiry) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeConsent(choices) {
  const payload = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    choices,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: payload }));
  return payload;
}

// À importer ailleurs dans l'app pour savoir si un script tiers peut se charger
export function getConsent() {
  const stored = getStoredConsent();
  if (!stored) return null;
  return stored.choices;
}

// À appeler depuis un lien "Gérer les cookies" dans le footer
export function openCookieSettings() {
  window.dispatchEvent(new Event("openCookieSettings"));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [choices, setChoices] = useState({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    } else {
      setChoices(stored.choices);
    }

    const reopen = () => {
      setChoices((prev) => getStoredConsent()?.choices ?? prev);
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener("openCookieSettings", reopen);
    return () => window.removeEventListener("openCookieSettings", reopen);
  }, []);

  const acceptAll = () => {
    const all = { necessary: true, analytics: true, marketing: true };
    setChoices(all);
    storeConsent(all);
    setVisible(false);
  };

  const rejectAll = () => {
    const minimal = { necessary: true, analytics: false, marketing: false };
    setChoices(minimal);
    storeConsent(minimal);
    setVisible(false);
  };

  const saveCustom = () => {
    storeConsent(choices);
    setVisible(false);
  };

  const toggleCategory = (id) => {
    setChoices((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        padding: "20px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px 0", fontSize: 14, lineHeight: 1.5, color: "#1f2937" }}>
          Vimen utilise des cookies pour assurer le bon fonctionnement du site, mesurer son
          audience et, si vous l'acceptez, personnaliser votre expérience. Vous pouvez choisir
          librement quelles catégories accepter. Consultez notre{" "}
          <a href="/politique-confidentialite" style={{ color: "#2563eb", textDecoration: "underline" }}>
            politique de confidentialité
          </a>{" "}
          pour en savoir plus.
        </p>

        {showDetails && (
          <div style={{ margin: "12px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 10,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: cat.locked ? "default" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={choices[cat.id]}
                  disabled={cat.locked}
                  onChange={() => toggleCategory(cat.id)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#111827" }}>
                    {cat.label} {cat.locked && "(toujours actif)"}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: "#6b7280" }}>
                    {cat.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
          <button
            onClick={rejectAll}
            style={{
              flex: "1 1 auto",
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Tout refuser
          </button>

          {showDetails ? (
            <button
              onClick={saveCustom}
              style={{
                flex: "1 1 auto",
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#111827",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Enregistrer mes choix
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              style={{
                flex: "1 1 auto",
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Personnaliser
            </button>
          )}

          <button
            onClick={acceptAll}
            style={{
              flex: "1 1 auto",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}