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
          <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 18, letterSpacing: -0.5 }}>
            TRADIE
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#features" style={{ fontSize: 14, color: T.muted, textDecoration: "none", fontWeight: 500 }}>{t("home.nav.features")}</a>
            <a href="#pricing" style={{ fontSize: 14, color: T.muted, textDecoration: "none", fontWeight: 500 }}>{t("home.nav.pricing")}</a>
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

function KeyValueRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 4 }}>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: T.hint }}>{label}</span>
      <span style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 20, color: T.brand }}>{value}</span>
    </div>
  );
}

function StatusPill({ children, color }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: `${color}1A`, color }}>
      {children}
    </span>
  );
}

function BookingVisual({ t }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>JM</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{t("home.features.booking.visual.name")}</div>
          <StatusPill color={T.green}>{t("home.features.booking.visual.badge")}</StatusPill>
        </div>
      </div>
      <div style={{ background: T.surface, borderRadius: 10, padding: 14, marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t("home.features.booking.visual.service1")}</div>
        <div style={{ fontSize: 13, color: T.brand, fontWeight: 700 }}>£65</div>
      </div>
      <div style={{ background: T.surface, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t("home.features.booking.visual.service2")}</div>
        <div style={{ fontSize: 13, color: T.brand, fontWeight: 700 }}>£120</div>
      </div>
      <div style={{ background: T.brand, color: "#fff", textAlign: "center", padding: 12, borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
        {t("home.features.booking.visual.cta")}
      </div>
    </div>
  );
}

function QuotesVisual({ t }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.brand }}>{t("home.features.quotes.visual.number")}</div>
        <StatusPill color={T.green}>{t("home.features.quotes.visual.status")}</StatusPill>
      </div>
      <KeyValueRow label={t("home.features.quotes.visual.line1")} value="£320" />
      <KeyValueRow label={t("home.features.quotes.visual.line2")} value="£180" />
      <TotalRow label={t("home.features.quotes.visual.totalLabel")} value="£500" />
    </div>
  );
}

function InvoicesVisual({ t }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.brand }}>{t("home.features.invoices.visual.number")}</div>
        <StatusPill color={T.green}>{t("home.features.invoices.visual.status")}</StatusPill>
      </div>
      <KeyValueRow label={t("home.features.invoices.visual.billTo")} value={t("home.features.invoices.visual.client")} />
      <KeyValueRow label={t("home.features.invoices.visual.line")} value="£850" />
      <TotalRow label={t("home.features.invoices.visual.totalLabel")} value="£850" />
    </div>
  );
}

function PaymentsVisual({ t }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{t("home.features.payments.visual.title")}</div>
      <KeyValueRow label={t("home.features.payments.visual.amount")} value="£550" />
      <KeyValueRow label={t("home.features.payments.visual.processing")} value="£7.90" />
      <KeyValueRow label={t("home.features.payments.visual.platform")} value="£11.00" />
      <TotalRow label={t("home.features.payments.visual.receive")} value="£531.10" />
    </div>
  );
}

function ClientsVisual({ t }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{t("home.features.clients.visual.title")}</div>
      {[
        [t("home.features.clients.visual.client1"), "8", "£3,240"],
        [t("home.features.clients.visual.client2"), "3", "£1,120"],
        [t("home.features.clients.visual.client3"), "12", "£5,880"],
      ].map(([name, jobs, revenue]) => (
        <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 12, color: T.hint }}>{jobs} {t("home.features.clients.visual.jobsLabel")}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.brand }}>{revenue}</div>
        </div>
      ))}
    </div>
  );
}

function GrowthVisual({ t }) {
  return (
    <div style={{ background: T.surface2, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 32, letterSpacing: -1 }}>4.9</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t("home.features.growth.visual.reviewsLabel")}</div>
          <div style={{ fontSize: 12, color: T.hint }}>{t("home.features.growth.visual.reviewsCount")}</div>
        </div>
      </div>
      <div style={{ background: T.surface, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t("home.features.growth.visual.referralTitle")}</div>
        <div style={{ fontSize: 12, color: T.muted }}>{t("home.features.growth.visual.referralDesc")}</div>
      </div>
    </div>
  );
}

const FEATURE_TABS = ["booking", "quotes", "invoices", "payments", "clients", "growth"];
const FEATURE_VISUALS = {
  booking: BookingVisual,
  quotes: QuotesVisual,
  invoices: InvoicesVisual,
  payments: PaymentsVisual,
  clients: ClientsVisual,
  growth: GrowthVisual,
};

function FeatureTabs({ t }) {
  const [active, setActive] = useState("booking");
  const Visual = FEATURE_VISUALS[active];

  return (
    <section id="features" style={{ padding: "100px 0" }}>
      <div style={S.wrap}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.hint, letterSpacing: "1.5px", textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>
          {t("home.features.eyebrow")}
        </div>
        <h2 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(28px,4vw,44px)", letterSpacing: -1, textAlign: "center", marginBottom: 48 }}>
          {t("home.features.title")}
        </h2>

        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 48, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {FEATURE_TABS.map(id => (
            <button key={id} onClick={() => setActive(id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "14px 20px", fontSize: 14, fontWeight: 600,
                color: active === id ? T.brand : T.muted,
                borderBottom: active === id ? `2px solid ${T.brand}` : "2px solid transparent",
              }}>
              {t(`home.features.${id}.tabLabel`)}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 16 }}>
              {t(`home.features.${active}.title`)}
            </h3>
            <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, marginBottom: 24 }}>
              {t(`home.features.${active}.desc`)}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[1, 2, 3].map(i => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, fontSize: 14, color: T.text }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.brand, marginTop: 7, flexShrink: 0 }} />
                  {t(`home.features.${active}.bullet${i}`)}
                </li>
              ))}
            </ul>
          </div>
          <Visual t={t} />
        </div>
      </div>
    </section>
  );
}

function PricingSection({ t, onSignUp }) {
  const plans = [
    { id: "free", name: t("home.pricing.plans.free.name"), price: "£0", sub: t("home.pricing.plans.free.sub"), highlight: false },
    { id: "pro", name: t("home.pricing.plans.pro.name"), price: "£29", sub: t("home.pricing.plans.pro.sub"), highlight: true },
    { id: "team", name: t("home.pricing.plans.team.name"), price: "£79", sub: t("home.pricing.plans.team.sub"), highlight: false },
  ];

  return (
    <section id="pricing" style={{ padding: "100px 0", borderTop: `1px solid ${T.border}`, background: T.surface2 }}>
      <div style={S.wrap}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.hint, letterSpacing: "1.5px", textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>
          {t("home.pricing.eyebrow")}
        </div>
        <h2 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(28px,4vw,44px)", letterSpacing: -1, textAlign: "center", marginBottom: 16 }}>
          {t("home.pricing.title")}
        </h2>
        <p style={{ fontSize: 16, color: T.muted, textAlign: "center", maxWidth: 480, margin: "0 auto 56px", lineHeight: 1.7 }}>
          {t("home.pricing.sub")}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {plans.map(p => (
            <div key={p.id} style={{
              background: T.surface,
              border: `1px solid ${p.highlight ? T.brand : T.border}`,
              borderRadius: 16,
              padding: 28,
              position: "relative",
            }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: -12, left: 24, background: T.brand, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {t("home.pricing.mostPopular")}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>{p.name}</div>
              <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 36, letterSpacing: -1, marginBottom: 4 }}>
                {p.price}<span style={{ fontFamily: "Inter", fontSize: 14, fontWeight: 500, color: T.hint }}>{t("home.pricing.perMonth")}</span>
              </div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>{p.sub}</div>
              <button onClick={onSignUp} style={{
                width: "100%", padding: "12px 0", borderRadius: 6, border: p.highlight ? "none" : `1px solid ${T.border}`,
                background: p.highlight ? T.brand : "transparent",
                color: p.highlight ? "#fff" : T.text,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                {t("home.pricing.cta")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ onSignIn, onSignUp }) {
  const { t, lang, setLanguage, languages } = useTranslation();

  const stats = [
    ["2%", t("home.hero.stats.fee")],
    ["5 min", t("home.hero.stats.setup")],
    ["£0", t("home.hero.stats.free")],
  ];

  return (
    <div style={S.page}>
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} t={t} lang={lang} setLanguage={setLanguage} languages={languages} />

      <header style={{ padding: "90px 0 70px", textAlign: "center" }}>
        <div style={S.wrap}>
          <h1 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(38px,5.5vw,64px)", lineHeight: 1.05, letterSpacing: -2, marginBottom: 24 }}>
            {t("home.hero.titleLine1")}
            <br />
            {t("home.hero.titleLine2")}
          </h1>
          <p style={{ fontSize: 18, color: T.muted, maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.65 }}>
            {t("home.hero.sub")}
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
            <button onClick={onSignUp} style={{ background: T.brand, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              {t("home.hero.ctaPrimary")}
            </button>
            <a href="#pricing" style={{ border: `1px solid ${T.border}`, color: T.text, padding: "14px 28px", borderRadius: 6, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
              {t("home.hero.ctaSecondary")}
            </a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 56, flexWrap: "wrap" }}>
            {stats.map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 26, letterSpacing: -0.5 }}>{n}</div>
                <div style={{ fontSize: 12, color: T.hint, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <FeatureTabs t={t} />

      <PricingSection t={t} onSignUp={onSignUp} />

      <section style={{ padding: "90px 0", textAlign: "center", borderTop: `1px solid ${T.border}` }}>
        <div style={S.wrap}>
          <h2 style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: "clamp(28px,4vw,44px)", letterSpacing: -1, marginBottom: 20 }}>
            {t("home.finalCta.title")}
          </h2>
          <p style={{ fontSize: 16, color: T.muted, marginBottom: 32, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.65 }}>
            {t("home.finalCta.sub")}
          </p>
          <button onClick={onSignUp} style={{ background: T.brand, color: "#fff", border: "none", padding: "14px 32px", borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            {t("home.finalCta.cta")}
          </button>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px 0" }}>
        <div style={{ ...S.wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 15 }}>TRADIE</div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#features" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("home.nav.features")}</a>
            <a href="#pricing" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("home.nav.pricing")}</a>
            <a href="mailto:hello@tradie.app" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>{t("home.footer.contact")}</a>
          </div>
          <p style={{ color: T.hint, fontSize: 13 }}>{t("home.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
