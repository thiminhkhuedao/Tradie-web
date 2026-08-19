// components/ErrorBoundary.jsx
import React from "react";
import { T } from "../styles/tokens";

// Détection simple FR/EN pour ce texte d'erreur générique — ce composant
// est une classe, donc pas d'accès direct à useTranslation() ici.
const isFrench = () =>
  typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr");

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Détail complet uniquement dans la console (visible pour toi en devtools,
    // jamais affiché à l'utilisateur).
    console.error("Component Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Mode page complète : pour une erreur au sommet de l'app (voir main.jsx).
      // Un simple "retry" local ne suffit pas forcément à réparer un état
      // corrompu — on propose un vrai rechargement de page.
      if (this.props.fullPage) {
        const fr = isFrench();
        return (
          <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: T.bg || "#F5F4F1",
            fontFamily: "-apple-system, sans-serif",
          }}>
            <div style={{ textAlign: "center", maxWidth: 420 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: T.text || "#131211" }}>
                {fr ? "Oups, une erreur est survenue" : "Oops, something went wrong"}
              </h2>
              <p style={{ fontSize: 14, color: T.muted || "#666", marginBottom: 24, lineHeight: 1.6 }}>
                {fr
                  ? "Le problème a été enregistré. Essaie de recharger la page — si ça persiste, contacte le support."
                  : "The issue has been logged. Try reloading the page — if it persists, contact support."}
              </p>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 24px",
                  borderRadius: T.r?.md || 8,
                  border: "none",
                  background: T.brand || "#E8500A",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {fr ? "Recharger la page" : "Reload page"}
              </button>
            </div>
          </div>
        );
      }

      // Mode local (comportement d'origine, inchangé) : pour une section
      // précise de l'app qui plante sans devoir tout recharger.
      return (
        <div style={{
          padding: 20,
          borderRadius: T.r.md || 8,
          background: T.surface2 || "#F1F5F9",
          border: `1px solid ${T.border || "#CBD5E1"}`,
          textAlign: "center",
          color: T.muted || "#64748B",
          fontSize: 14
        }}>
          <p style={{ margin: "0 0 12px 0" }}>
            {this.props.fallbackText || "This section is currently unavailable."}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "6px 12px",
              borderRadius: T.r.sm || 4,
              border: `1px solid ${T.border || "#CBD5E1"}`,
              background: "#FFFFFF",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}