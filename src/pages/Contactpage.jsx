import { useState } from "react";
import { T } from "../styles/tokens";
import { useTranslation } from "../i18n/index.js";
import { supabase } from "../lib/supabase";

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

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 8,
  border: `1px solid ${T.border}`, fontSize: 14,
  background: T.surface, color: T.text,
  boxSizing: "border-box", fontFamily: "inherit",
};

export default function ContactPage({ onSignIn, onSignUp }) {
  const { t, lang, setLanguage, languages } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const fld = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const { error } = await supabase.functions.invoke("send-contact-email", { body: form });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div style={S.page}>
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} t={t} lang={lang} setLanguage={setLanguage} languages={languages} />

      <header style={{ padding: "80px 0 40px", textAlign: "center" }}>
        <div style={S.wrap}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.hint, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
            {t("contactPage.eyebrow")}
          </div>
          <h1 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(32px,5vw,52px)", letterSpacing: -1.5, marginBottom: 20 }}>
            {t("contactPage.title")}
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
            {t("contactPage.sub")}
          </p>
        </div>
      </header>

      <section style={{ padding: "20px 0 100px" }}>
        <div style={{ ...S.wrap, maxWidth: 520 }}>
          {status === "sent" ? (
            <div style={{ background: T.surface2, borderRadius: 16, padding: 40, textAlign: "center", border: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t("contactPage.sentTitle")}</h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{t("contactPage.sentSub")}</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ background: T.surface2, borderRadius: 16, padding: 32, border: `1px solid ${T.border}` }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: T.muted }}>{t("contactPage.nameLabel")}</label>
                <input style={inputStyle} value={form.name} onChange={fld("name")} placeholder={t("contactPage.namePlaceholder")} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: T.muted }}>{t("contactPage.emailLabel")}</label>
                <input type="email" style={inputStyle} value={form.email} onChange={fld("email")} placeholder={t("contactPage.emailPlaceholder")} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: T.muted }}>{t("contactPage.messageLabel")}</label>
                <textarea style={{ ...inputStyle, height: 120, resize: "vertical" }} value={form.message} onChange={fld("message")} placeholder={t("contactPage.messagePlaceholder")} />
              </div>
              {status === "error" && (
                <p style={{ fontSize: 13, color: T.red, marginBottom: 16 }}>{t("contactPage.error")}</p>
              )}
              <button type="submit" disabled={status === "sending"} style={{
                width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
                background: T.brand, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                opacity: status === "sending" ? 0.6 : 1,
              }}>
                {status === "sending" ? t("contactPage.sending") : t("contactPage.send")}
              </button>
            </form>
          )}
          <p style={{ fontSize: 13, color: T.hint, textAlign: "center", marginTop: 24 }}>
            {t("contactPage.emailAlternative")} hello@tradie.app
          </p>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}