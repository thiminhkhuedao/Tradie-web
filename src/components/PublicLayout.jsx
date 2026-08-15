import { T } from "../styles/tokens";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/index.js";

const S = {
  wrap: {
    maxWidth: 1160,
    margin: "0 auto",
    padding: "0 28px",
  },
  brandLogo: {
    fontFamily: "'Archivo Black', sans-serif",
    fontSize: 18,
    letterSpacing: -0.5,
    color: T.text,
    textDecoration: "none",
  },
};

function LangSwitch({ lang, setLanguage, languages = [] }) {
  return (
    <div
      role="group"
      aria-label="Language selector"
      style={{
        display: "flex",
        gap: 2,
        background: T.surface2 || T.border,
        borderRadius: T.r?.full || 999,
        padding: 2,
      }}
    >
      {languages.map((l) => {
        const isActive = lang === l.code;

        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage?.(l.code)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: T.r?.full || 999,
              fontSize: 12,
              fontWeight: 700,
              background: isActive ? T.surface : "transparent",
              color: isActive ? T.text : T.hint,
            }}
          >
            {l.code?.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function NavBar({ onSignIn, onSignUp, t, lang, setLanguage, languages }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          ...S.wrap,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Link to="/" style={S.brandLogo}>
            Vimen
          </Link>

          <div style={{ display: "flex", gap: 24 }}>
            <Link
              to="/#features"
              style={{
                fontSize: 14,
                color: T.muted,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              {t("home.nav.features")}
            </Link>

            <Link
              to="/pricing"
              style={{
                fontSize: 14,
                color: T.muted,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Pricing
            </Link>

            <Link
              to="/about"
              style={{
                fontSize: 14,
                color: T.muted,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              About Us
            </Link>

            <Link
              to="/faq"
              style={{
                fontSize: 14,
                color: T.muted,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              FAQ
            </Link>

            <Link
              to="/contact"
              style={{
                fontSize: 14,
                color: T.muted,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Contact
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <LangSwitch
            lang={lang}
            setLanguage={setLanguage}
            languages={languages}
          />

          <button
            type="button"
            onClick={onSignIn}
            style={{
              background: "none",
              border: "none",
              color: T.muted,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "8px 4px",
            }}
          >
            {t("home.nav.signIn")}
          </button>

          <button
            type="button"
            onClick={onSignUp}
            style={{
              background: T.brand,
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: T.r?.md || 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("home.nav.startFree")}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Footer({ t }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${T.border}`,
        padding: "40px 0",
      }}
    >
      <div
        style={{
          ...S.wrap,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <Link to="/" style={{ ...S.brandLogo, fontSize: 15 }}>
          Vimen
        </Link>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/#features"
            style={{
              fontSize: 13,
              color: T.hint,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {t("home.nav.features")}
          </Link>

          <Link
            to="/pricing"
            style={{
              fontSize: 13,
              color: T.hint,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Pricing
          </Link>

          <Link
            to="/about"
            style={{
              fontSize: 13,
              color: T.hint,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            About Us
          </Link>

          <Link
            to="/faq"
            style={{
              fontSize: 13,
              color: T.hint,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            FAQ
          </Link>

          <Link
            to="/contact"
            style={{
              fontSize: 13,
              color: T.hint,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Contact
          </Link>
        </div>

        <p style={{ color: T.hint, fontSize: 13, margin: 0 }}>
          {t("home.footer.copyright")}
        </p>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
  onSignIn,
  onSignUp,
}) {
  // This hook has to be here so every public page shares
  // the exact same language selector.
  const { t, lang, setLanguage, languages } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        color: T.text,
        fontFamily: "'Inter', sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <NavBar
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        t={t}
        lang={lang}
        setLanguage={setLanguage}
        languages={languages}
      />

      {children}

      <Footer t={t} />
    </div>
  );
}