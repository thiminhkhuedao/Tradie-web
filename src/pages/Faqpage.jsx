import { useState } from "react";
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

function FAQItem({ question, answer, open, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button onClick={onToggle} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "22px 0", textAlign: "left",
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{question}</span>
        <span style={{ fontSize: 20, color: T.hint, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.15s" }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, margin: "0 0 22px", maxWidth: 640 }}>
          {answer}
        </p>
      )}
    </div>
  );
}

export default function FAQPage({ onSignIn, onSignUp }) {
  const { t, lang, setLanguage, languages } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
    question: t(`faqPage.q${i}.question`),
    answer: t(`faqPage.q${i}.answer`),
  }));

  return (
    <div style={S.page}>
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} t={t} lang={lang} setLanguage={setLanguage} languages={languages} />

      <header style={{ padding: "80px 0 40px", textAlign: "center" }}>
        <div style={S.wrap}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.hint, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
            {t("faqPage.eyebrow")}
          </div>
          <h1 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(32px,5vw,52px)", letterSpacing: -1.5, marginBottom: 20 }}>
            {t("faqPage.title")}
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
            {t("faqPage.sub")}
          </p>
        </div>
      </header>

      <section style={{ padding: "40px 0 100px" }}>
        <div style={{ ...S.wrap, maxWidth: 720 }}>
          {items.map((item, i) => (
            <FAQItem
              key={i}
              question={item.question}
              answer={item.answer}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 0", textAlign: "center", borderTop: `1px solid ${T.border}`, background: T.surface2 }}>
        <div style={S.wrap}>
          <h2 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(22px,3vw,32px)", letterSpacing: -1, marginBottom: 16 }}>
            {t("faqPage.finalCta.title")}
          </h2>
          <a href="/contact" style={{ display: "inline-block", background: T.brand, color: "#fff", padding: "13px 28px", borderRadius: 6, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            {t("faqPage.finalCta.cta")}
          </a>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}