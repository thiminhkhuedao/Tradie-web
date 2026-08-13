// src/pages/PricingPage.jsx

import { useState, useCallback } from "react";
import { T } from "../styles/tokens";
import { useTranslation } from "../i18n/index.js";

const S = {
  page: {
    minHeight: "100vh",
    background: T.surface,
    color: T.text,
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  wrap: { maxWidth: 1160, margin: "0 auto", padding: "0 28px" },
};

export default function PricingPage({ onSignIn, onSignUp }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || "en";
  const locale = currentLang === "fr" ? "fr-FR" : "en-GB";
  const currencyCode = currentLang === "fr" ? "EUR" : "GBP";

  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "annual"
  const [openFaq, setOpenFaq] = useState(null);

  const fmt = useCallback(
    (n) => {
      return Number(n || 0).toLocaleString(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    },
    [locale, currencyCode]
  );

  const plans = [
    {
      id: "solo",
      nameKey: "pricingPage.plans.solo.name",
      taglineKey: "pricingPage.plans.solo.tagline",
      monthlyPrice: 15,
      annualPrice: 12,
      popular: false,
      features: [
        "pricingPage.plans.solo.feat1",
        "pricingPage.plans.solo.feat2",
        "pricingPage.plans.solo.feat3",
        "pricingPage.plans.solo.feat4",
        "pricingPage.plans.solo.feat5",
      ],
      ctaKey: "pricingPage.plans.solo.cta",
    },
    {
      id: "pro",
      nameKey: "pricingPage.plans.pro.name",
      taglineKey: "pricingPage.plans.pro.tagline",
      monthlyPrice: 29,
      annualPrice: 24,
      popular: true,
      features: [
        "pricingPage.plans.pro.feat1",
        "pricingPage.plans.pro.feat2",
        "pricingPage.plans.pro.feat3",
        "pricingPage.plans.pro.feat4",
        "pricingPage.plans.pro.feat5",
        "pricingPage.plans.pro.feat6",
      ],
      ctaKey: "pricingPage.plans.pro.cta",
    },
    {
      id: "team",
      nameKey: "pricingPage.plans.team.name",
      taglineKey: "pricingPage.plans.team.tagline",
      monthlyPrice: 59,
      annualPrice: 49,
      popular: false,
      features: [
        "pricingPage.plans.team.feat1",
        "pricingPage.plans.team.feat2",
        "pricingPage.plans.team.feat3",
        "pricingPage.plans.team.feat4",
        "pricingPage.plans.team.feat5",
        "pricingPage.plans.team.feat6",
      ],
      ctaKey: "pricingPage.plans.team.cta",
    },
  ];

  const faqs = [
    { qKey: "pricingPage.faq.q1", aKey: "pricingPage.faq.a1" },
    { qKey: "pricingPage.faq.q2", aKey: "pricingPage.faq.a2" },
    { qKey: "pricingPage.faq.q3", aKey: "pricingPage.faq.a3" },
    { qKey: "pricingPage.faq.q4", aKey: "pricingPage.faq.a4" },
  ];

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div style={S.page}>
      {/* Navbar */}
<nav style={{ borderBottom: `1px solid ${T.border}`, background: T.surface, position: "sticky", top: 0, zIndex: 10 }}>
  <div style={{ ...S.wrap, display: "flex", justifyContent: "space-between", alignItems: "center", height: 70 }}>
    
    {/* Logo & Navigation Links */}
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <a href="/" style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: T.text, textDecoration: "none" }}>
        Vimen
      </a>
      <div style={{ display: "flex", gap: 20 }}>
        <a href="/#features" style={{ fontSize: 14, color: T.muted, textDecoration: "none", fontWeight: 500 }}>
          {t("home.nav.features")}
        </a>
        <a href="/pricing" style={{ fontSize: 14, color: T.text, textDecoration: "none", fontWeight: 700 }}>
          {t("home.nav.pricing")}
        </a>
      </div>
    </div>

    {/* Auth Buttons */}
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <button
        onClick={onSignIn}
        style={{
          background: "transparent",
          border: "none",
          fontWeight: 600,
          fontSize: 14,
          color: T.text,
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        {t("pricingPage.nav.signIn", "Sign In")}
      </button>
      <button
        onClick={onSignUp}
        style={{
          background: T.brand,
          color: "#fff",
          border: "none",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          padding: "9px 18px",
          borderRadius: T.r.md,
        }}
      >
        {t("pricingPage.nav.signUp", "Get Started")}
      </button>
    </div>

  </div>
</nav>

      {/* Header & Toggle */}
      <section style={{ padding: "60px 0 40px", textAlign: "center" }}>
        <div style={S.wrap}>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 16px" }}>
            {t("pricingPage.hero.title")}
          </h1>
          <p style={{ fontSize: 18, color: T.muted, maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.5 }}>
            {t("pricingPage.hero.subtitle")}
          </p>

          {/* Billing Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: T.surface2, padding: 4, borderRadius: T.r.full, border: `1px solid ${T.border}` }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "8px 20px",
                borderRadius: T.r.full,
                border: "none",
                background: billingCycle === "monthly" ? T.surface : "transparent",
                color: billingCycle === "monthly" ? T.text : T.muted,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: billingCycle === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t("pricingPage.billing.monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              style={{
                padding: "8px 20px",
                borderRadius: T.r.full,
                border: "none",
                background: billingCycle === "annual" ? T.surface : "transparent",
                color: billingCycle === "annual" ? T.text : T.muted,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: billingCycle === "annual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{t("pricingPage.billing.annual")}</span>
              <span style={{ fontSize: 11, background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: T.r.full, fontWeight: 800 }}>
                {t("pricingPage.billing.saveDiscount")}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ paddingBottom: 80 }}>
        <div style={{ ...S.wrap, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "stretch" }}>
          {plans.map((plan) => {
            const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                style={{
                  background: T.surface,
                  border: plan.popular ? `2px solid ${T.brand}` : `1px solid ${T.border}`,
                  borderRadius: T.r.lg,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: plan.popular ? "0 10px 30px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: T.brand,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "4px 14px",
                      borderRadius: T.r.full,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("pricingPage.popularBadge")}
                  </div>
                )}

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>{t(plan.nameKey)}</h3>
                <p style={{ fontSize: 13, color: T.muted, margin: "0 0 24px", minHeight: 38 }}>{t(plan.taglineKey)}</p>

                <div style={{ marginBottom: 28, display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>{fmt(price)}</span>
                  <span style={{ fontSize: 14, color: T.muted }}>/ {t("pricingPage.monthAbbr")}</span>
                </div>

                <div style={{ flex: 1, marginBottom: 32 }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {plan.features.map((fKey, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                        <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
                        <span>{t(fKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={onSignUp}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: T.r.md,
                    border: plan.popular ? "none" : `1px solid ${T.borderMed}`,
                    background: plan.popular ? T.brand : T.surface2,
                    color: plan.popular ? "#fff" : T.text,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {t(plan.ctaKey)}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: "60px 0 80px", background: T.surface2, borderTop: `1px solid ${T.border}` }}>
        <div style={{ ...S.wrap, maxWidth: 800 }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 28, textAlign: "center", marginBottom: 36 }}>
            {t("pricingPage.faq.title")}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => toggleFaq(idx)}
                  style={{
                    background: T.surface,
                    borderRadius: T.r.md,
                    border: `1px solid ${T.border}`,
                    padding: "18px 24px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 16 }}>
                    <span>{t(faq.qKey)}</span>
                    <span style={{ fontSize: 18, color: T.muted }}>{isOpen ? "−" : "+"}</span>
                  </div>
                  {isOpen && (
                    <p style={{ marginTop: 12, fontSize: 14, color: T.muted, lineHeight: 1.6, margin: "12px 0 0" }}>
                      {t(faq.aKey)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section style={{ padding: "80px 0", textAlign: "center" }}>
        <div style={S.wrap}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: "clamp(26px, 3.5vw, 38px)", letterSpacing: -1, marginBottom: 18 }}>
            {t("pricingPage.finalCta.title")}
          </h2>
          <button
            onClick={onSignUp}
            style={{
              background: T.brand,
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: T.r.md,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {t("pricingPage.finalCta.cta")}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px 0" }}>
        <div style={{ ...S.wrap, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <a href="/" style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 15, color: T.text, textDecoration: "none" }}>
            Vimen
          </a>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="/#features" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>
              {t("home.nav.features")}
            </a>
            <a href="/pricing" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>
              {t("home.nav.pricing")}
            </a>
            <a href="mailto:hello@Vimen.app" style={{ fontSize: 13, color: T.hint, fontWeight: 600, textDecoration: "none" }}>
              {t("home.footer.contact")}
            </a>
          </div>
          <p style={{ color: T.hint, fontSize: 13, margin: 0 }}>{t("home.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}