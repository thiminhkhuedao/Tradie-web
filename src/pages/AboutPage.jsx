import { T } from "../styles/tokens.js";
import { useTranslation } from "../i18n/index.js";
import PublicLayout from "../components/PublicLayout.jsx";

const S = {
  page: {
    minHeight: "100vh",
    background: T.surface,
    color: T.text,
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
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

function ValueCard({ title, desc }) {
  return (
    <div
      style={{
        background: T.surface2 || T.surface,
        borderRadius: T.r?.lg || 16,
        padding: 28,
        border: `1px solid ${T.border}`,
      }}
    >
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, marginTop: 0 }}>{title}</h3>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  );
}

export default function AboutPage({ onSignIn, onSignUp }) {
  const { t, lang, setLanguage, languages } = useTranslation();

  return (

  <PublicLayout
    onSignIn={onSignIn}
    onSignUp={onSignUp}
  >

      <header style={{ padding: "80px 0 60px", textAlign: "center" }}>
        <div style={S.wrap}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T.hint,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {t("aboutPage.eyebrow")}
          </div>
          <h1
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              letterSpacing: -1.5,
              marginBottom: 20,
              marginTop: 0,
            }}
          >
            {t("aboutPage.title")}
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
            {t("aboutPage.sub")}
          </p>
        </div>
      </header>

      <section style={{ padding: "0 0 80px" }}>
        <div style={{ ...S.wrap, maxWidth: 680 }}>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8, marginBottom: 24, marginTop: 0 }}>
            {t("aboutPage.paragraph1")}
          </p>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8, marginBottom: 24 }}>
            {t("aboutPage.paragraph2")}
          </p>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8, marginBottom: 0 }}>
            {t("aboutPage.paragraph3")}
          </p>
        </div>
      </section>

      <section style={{ padding: "0 0 100px" }}>
        <div style={S.wrap}>
          <h2
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: "clamp(24px, 3.5vw, 34px)",
              letterSpacing: -1,
              textAlign: "center",
              marginBottom: 40,
              marginTop: 0,
            }}
          >
            {t("aboutPage.valuesTitle")}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            <ValueCard title={t("aboutPage.value1.title")} desc={t("aboutPage.value1.desc")} />
            <ValueCard title={t("aboutPage.value2.title")} desc={t("aboutPage.value2.desc")} />
            <ValueCard title={t("aboutPage.value3.title")} desc={t("aboutPage.value3.desc")} />
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "60px 0",
          textAlign: "center",
          borderTop: `1px solid ${T.border}`,
          background: T.surface2 || T.surface,
        }}
      >
        <div style={S.wrap}>
          <h2
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: "clamp(22px, 3vw, 32px)",
              letterSpacing: -1,
              marginBottom: 16,
              marginTop: 0,
            }}
          >
            {t("aboutPage.finalCta.title")}
          </h2>
          <button
            type="button"
            onClick={onSignUp}
            style={{
              background: T.brand,
              color: "#fff",
              border: "none",
              padding: "13px 28px",
              borderRadius: T.r?.md || 6,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t("aboutPage.finalCta.cta")}
          </button>
        </div>
      </section>

      </PublicLayout>
  );
}
