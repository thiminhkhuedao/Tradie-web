import { T } from "../styles/tokens";
import { useTranslation } from "../i18n/index.js";

const S = {
  page: { minHeight: "100vh", background: T.surface, color: T.text, fontFamily: "'Inter',sans-serif", WebkitFontSmoothing: "antialiased" },
  wrap: { maxWidth: 1160, margin: "0 auto", padding: "0 28px" },
};

function LangSwitch({ lang, setLanguage, languages }) {
  return (
    <div style={{ display: "flex", gap: 2, background: T.surface2, borderRadius: 999, padding: 2 }}>
      {languages.map(l => (
        <button key={l.code} onClick={() => setLanguage(l.code)}
          style={{
            border: "none", cursor: "pointer", padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            background: lang === l.code ? T.surface : "transparent",
            color: lang === l.code ? T.text : T.hint,
            boxShadow: lang === l.code ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}>
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function NavBar({ onSignIn, onSignUp, t, lang, setLanguage, languages }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <a href="/" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 18, letterSpacing: -0.5, color: T.text, textDecoration: "none" }}>
            TRADIE
          </a>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="/#features" style={{ fontSize: 14, color: T.muted, textDecoration: "none", fontWeight: 500 }}>{t("home.nav.features")}</a>
            <a href="/pricing" style={{ fontSize: 14, color: T.muted, textDecoration: "none", fontWeight: 500 }}>{t("home.nav.pricing")}</a>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <LangSwitch lang={lang} setLanguage={setLanguage} languages={languages} />
          <button onClick={onSignIn} style={{ background: "none", border: "none", color: T.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 4px" }}>
            {t("home.nav.signIn")}
          </button>
          <button onClick={onSignUp} style={{ background: T.brand, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {t("home.nav.startFree")}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Footer({ t }) {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px 0" }}>
      <div style={{ ...S.wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <a href="/" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 15, color: T.text, textDecoration: "none" }}>TRADIE</a>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a href="/#features" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("home.nav.features")}</a>
          <a href="/pricing" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("home.nav.pricing")}</a>
          <a href="/faq" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("footerNav.faq")}</a>
          <a href="/about" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("footerNav.about")}</a>
          <a href="/contact" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("footerNav.contact")}</a>
        </div>
        <p style={{ color: T.hint, fontSize: 13 }}>{t("home.footer.copyright")}</p>
      </div>
    </footer>
  );
}

function ValueCard({ title, desc }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 28, border: `1px solid ${T.border}` }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  );
}

export default function AboutPage({ onSignIn, onSignUp }) {
  const { t, lang, setLanguage, languages } = useTranslation();

  return (
    <div style={S.page}>
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} t={t} lang={lang} setLanguage={setLanguage} languages={languages} />

      <header style={{ padding: "80px 0 60px", textAlign: "center" }}>
        <div style={S.wrap}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.hint, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
            {t("aboutPage.eyebrow")}
          </div>
          <h1 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(32px,5vw,52px)", letterSpacing: -1.5, marginBottom: 20 }}>
            {t("aboutPage.title")}
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
            {t("aboutPage.sub")}
          </p>
        </div>
      </header>

      <section style={{ padding: "0 0 80px" }}>
        <div style={{ ...S.wrap, maxWidth: 680 }}>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8, marginBottom: 24 }}>
            {t("aboutPage.paragraph1")}
          </p>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8, marginBottom: 24 }}>
            {t("aboutPage.paragraph2")}
          </p>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8 }}>
            {t("aboutPage.paragraph3")}
          </p>
        </div>
      </section>

      <section style={{ padding: "0 0 100px" }}>
        <div style={S.wrap}>
          <h2 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(24px,3.5vw,34px)", letterSpacing: -1, textAlign: "center", marginBottom: 40 }}>
            {t("aboutPage.valuesTitle")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
            <ValueCard title={t("aboutPage.value1.title")} desc={t("aboutPage.value1.desc")} />
            <ValueCard title={t("aboutPage.value2.title")} desc={t("aboutPage.value2.desc")} />
            <ValueCard title={t("aboutPage.value3.title")} desc={t("aboutPage.value3.desc")} />
          </div>
        </div>
      </section>

      <section style={{ padding: "60px 0", textAlign: "center", borderTop: `1px solid ${T.border}`, background: T.surface2 }}>
        <div style={S.wrap}>
          <h2 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(22px,3vw,32px)", letterSpacing: -1, marginBottom: 16 }}>
            {t("aboutPage.finalCta.title")}
          </h2>
          <button onClick={onSignUp} style={{ background: T.brand, color: "#fff", border: "none", padding: "13px 28px", borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {t("aboutPage.finalCta.cta")}
          </button>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}