// src/pages/PublicQuotePage.jsx
//
// Page publique (pas d'authentification) accessible via le lien envoyé
// par email au client : /quote/:token
//
// Route à ajouter dans ton router :
//   <Route path="/quote/:token" element={<PublicQuotePage />} />

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { T } from "../styles/tokens";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../lib/currency.js";
import { useTranslation } from "../i18n/index.js";

const fmtDate = (d, locale) => {
  try {
    return new Date(d).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return "";
  }
};

export default function PublicQuotePage() {
  const { token } = useParams();
  const { t, lang, setLanguage, languages } = useTranslation();

  const [quote, setQuote] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [signName, setSignName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);
  const [justSigned, setJustSigned] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-public-quote", {
          body: { token },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message || t("publicQuote.notFound.generic"));
        setQuote(data.quote);
      } catch (err) {
        setLoadError(err.message || t("publicQuote.notFound.generic"));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fmt = (n) => formatCurrency(n, quote?.profile?.currency ?? "EUR");

  const STATUS_LABEL = {
    draft: t("publicQuote.status.draft"),
    sent: t("publicQuote.status.awaitingReview"),
    viewed: t("publicQuote.status.awaitingReview"),
    accepted: t("publicQuote.status.accepted"),
    declined: t("publicQuote.status.declined"),
    converted: t("publicQuote.status.accepted"),
  };

  async function handleSign(e) {
    e.preventDefault();
    if (!signName.trim() || !agreed) return;
    setIsSigning(true);
    setSignError(null);
    try {
      const { data, error } = await supabase.functions.invoke("sign-quote", {
        body: { token, signedBy: signName.trim() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || t("publicQuote.accept.errorGeneric"));
      setJustSigned(true);
      setQuote((q) => ({ ...q, status: "accepted", signed_at: data.signedAt, signed_by: signName.trim() }));
    } catch (err) {
      setSignError(err.message || t("publicQuote.accept.errorGeneric"));
    } finally {
      setIsSigning(false);
    }
  }

  if (isLoading) {
    return (
      <PageWrap lang={lang} setLanguage={setLanguage} languages={languages}>
        <div style={{ textAlign: "center", color: T.muted, padding: "80px 20px" }}>
          {t("publicQuote.loading")}
        </div>
      </PageWrap>
    );
  }

  if (loadError || !quote) {
    return (
      <PageWrap lang={lang} setLanguage={setLanguage} languages={languages}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t("publicQuote.notFound.title")}</div>
          <div style={{ fontSize: 14, color: T.muted }}>{loadError}</div>
        </div>
      </PageWrap>
    );
  }

  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const isSigned = quote.status === "accepted" || quote.status === "converted";
  const canSign = !isSigned && quote.status !== "declined" && !isExpired;

  return (
    <PageWrap lang={lang} setLanguage={setLanguage} languages={languages}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.brand, letterSpacing: -0.5 }}>Vimen</div>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r.xl, padding: 28, boxShadow: T.shadow.md }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{quote.quote_number}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>
                {t("publicQuote.from", { name: quote.profile?.name })}
                {quote.profile?.trade ? ` · ${quote.profile.trade}` : ""}
              </div>
            </div>
            <div
              style={{
                fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: T.r.full,
                background: isSigned ? "#dcfce7" : isExpired ? "#fee2e2" : "#fef3c7",
                color: isSigned ? "#166534" : isExpired ? "#991b1b" : "#92400e",
              }}
            >
              {isExpired && !isSigned ? t("publicQuote.status.expired") : STATUS_LABEL[quote.status] || quote.status}
            </div>
          </div>

          <div style={{ background: T.surface2, borderRadius: T.r.md, padding: "12px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              {t("publicQuote.preparedFor")}
            </div>
            <div style={{ fontWeight: 700 }}>{quote.client?.name}</div>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{quote.title}</div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>{t("publicQuote.table.description")}</th>
                <th style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>{t("publicQuote.table.qty")}</th>
                <th style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>{t("publicQuote.table.total")}</th>
              </tr>
            </thead>
            <tbody>
              {(quote.line_items || []).map((l, i) => (
                <tr key={i}>
                  <td style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>{l.description}</td>
                  <td style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}`, textAlign: "right", fontSize: 14, color: T.muted }}>{l.quantity}</td>
                  <td style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}`, textAlign: "right", fontSize: 14, fontWeight: 600 }}>{fmt(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
              <span style={{ color: T.muted }}>{t("publicQuote.totals.subtotal")}</span><span style={{ fontWeight: 600 }}>{fmt(quote.subtotal)}</span>
            </div>
            {quote.vat_rate > 0 && (
              <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
                <span style={{ color: T.muted }}>{t("publicQuote.totals.vat", { rate: quote.vat_rate })}</span><span style={{ fontWeight: 600 }}>{fmt(quote.vat_amount)}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 24, fontSize: 18, fontWeight: 800, borderTop: `2px solid ${T.text}`, paddingTop: 8 }}>
              <span>{t("publicQuote.totals.total")}</span><span style={{ color: T.brand }}>{fmt(quote.total)}</span>
            </div>
          </div>

          {quote.valid_until && !isSigned && (
            <div style={{ fontSize: 13, color: isExpired ? T.red : T.muted, marginBottom: 12 }}>
              {isExpired
                ? t("publicQuote.expiredOn", { date: fmtDate(quote.valid_until, lang) })
                : t("publicQuote.validUntil", { date: fmtDate(quote.valid_until, lang) })}
            </div>
          )}

          {quote.notes && (
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              {quote.notes}
            </div>
          )}

          {isSigned && (
            <div style={{ background: "#dcfce7", borderRadius: T.r.md, padding: "14px 16px", fontSize: 14, color: "#166534" }}>
              ✓ {t("publicQuote.acceptedBy", { name: quote.signed_by, date: fmtDate(quote.signed_at, lang) })}
            </div>
          )}

          {!isSigned && isExpired && (
            <div style={{ background: "#fee2e2", borderRadius: T.r.md, padding: "14px 16px", fontSize: 14, color: "#991b1b" }}>
              {t("publicQuote.expiredNotice", { name: quote.profile?.name })}
            </div>
          )}

          {canSign && !justSigned && (
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("publicQuote.accept.title")}</div>
              <form onSubmit={handleSign}>
                <input
                  type="text"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  placeholder={t("publicQuote.accept.namePlaceholder")}
                  disabled={isSigning}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: T.r.md,
                    border: `1px solid ${T.border}`, fontSize: 15, marginBottom: 12, boxSizing: "border-box",
                  }}
                />
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: T.muted, marginBottom: 16, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    disabled={isSigning}
                    style={{ marginTop: 2 }}
                  />
                  {t("publicQuote.accept.agreement", { amount: fmt(quote.total) })}
                </label>
                {signError && (
                  <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{signError}</div>
                )}
                <button
                  type="submit"
                  disabled={!signName.trim() || !agreed || isSigning}
                  style={{
                    width: "100%", padding: "14px", borderRadius: T.r.md, border: "none",
                    background: (!signName.trim() || !agreed) ? T.border : T.brand,
                    color: "#fff", fontSize: 15, fontWeight: 700,
                    cursor: (!signName.trim() || !agreed || isSigning) ? "not-allowed" : "pointer",
                  }}
                >
                  {isSigning ? t("publicQuote.accept.signing") : t("publicQuote.accept.signBtn")}
                </button>
              </form>
            </div>
          )}

          {justSigned && (
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t("publicQuote.success.title")}</div>
              <div style={{ fontSize: 13, color: T.muted }}>
                {t("publicQuote.success.sub", { name: quote.profile?.name })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrap>
  );
}

function PageWrap({ children, lang, setLanguage, languages }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif" }}>
      {languages?.length > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px 0" }}>
          <div style={{ display: "flex", gap: 2, background: T.surface2 || T.border, borderRadius: T.r?.full || 999, padding: 2 }}>
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage?.(l.code)}
                style={{
                  border: "none", cursor: "pointer", padding: "5px 10px",
                  borderRadius: T.r?.full || 999, fontSize: 12, fontWeight: 700,
                  background: lang === l.code ? T.surface : "transparent",
                  color: lang === l.code ? T.text : T.hint,
                }}
              >
                {l.code?.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
