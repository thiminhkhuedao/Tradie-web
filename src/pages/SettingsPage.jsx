// src/pages/SettingsPage.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { updateProfile } from "../lib/db";
import { T } from "../styles/tokens";
import {
  PageShell, Card, Btn, Badge, Avatar,
  Field, FieldRow, Divider, Toggle, Empty,
} from "../components/UI";
import { formatCurrency } from "../lib/currency.js";

import { VERTICALS, getVerticalForProfession, getProfileFields } from "../lib/professions.js";
import { useTranslation, LANGUAGES } from "../i18n/index.js";
import { CURRENCY_SYMBOLS } from "../lib/currency.js";

const iStyle = {
  width:"100%",padding:"10px 12px",borderRadius:8,
  border:"1px solid rgba(0,0,0,0.15)",fontSize:14,
  background:"#fff",color:"#131211",
  boxSizing:"border-box",fontFamily:"inherit",
};

export default function SettingsPage({ profile, setProfile }) {
  const { t, lang, setLanguage } = useTranslation();
  const fmt = n => formatCurrency(n, profile?.currency);
  const [tab, setTab] = useState("account");
  const [form, setForm] = useState({
    name:           profile?.name           ?? "",
    trade:          profile?.trade          ?? "",
    email:          profile?.email          ?? "",
    phone:          profile?.phone          ?? "",
    bio:            profile?.bio            ?? "",
    hourly_rate:    profile?.hourly_rate    ?? "",
    currency:       profile?.currency       ?? "GBP",
    bank_name:      profile?.bank_name      ?? "",
    sort_code:      profile?.sort_code      ?? "",
    account_number: profile?.account_number ?? "",
    payment_terms:  profile?.payment_terms  ?? "14 days",
    invoice_notes:  profile?.invoice_notes  ?? "",
    booking_slug:   profile?.booking_slug   ?? "",
    google_review_url: profile?.google_review_url ?? "",
    notif_email_booking:    profile?.notif_email_booking    ?? true,
    notif_sms_paid:         profile?.notif_sms_paid         ?? false,
    notif_weekly_digest:    profile?.notif_weekly_digest    ?? true,
    notif_overdue_reminder: profile?.notif_overdue_reminder ?? true,
    extra_fields:   profile?.extra_fields   ?? {},
  });
  const fields = getProfileFields(form.trade, t);
  const exFld  = key => val => setForm(p => ({ ...p, extra_fields: { ...p.extra_fields, [key]: val } }));
  const [saving, setSaving] = useState(false);
  const fld = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const tog = k => v  => setForm(p=>({...p,[k]:v}));

  async function save() {
    setSaving(true);
    const { data, error } = await updateProfile(profile.clerk_id, form);
    setSaving(false);
    if (error) { toast.error(t("settings.errorSave")); return; }
    setProfile?.(data);
    toast.success(t("settings.successSave"));
  }

  const TabBtn = ({ id, label }) => (
    <button onClick={()=>setTab(id)} style={{
      padding:"9px 20px", border:"none",
      borderBottom: tab===id ? `2px solid ${T.brand}` : "2px solid transparent",
      background:"transparent",
      color: tab===id ? T.brand : T.muted,
      fontSize:14, fontWeight:tab===id?700:400, cursor:"pointer",
    }}>{label}</button>
  );

  const SettingRow = ({ label, sub, k }) => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"14px 0",borderBottom:`1px solid ${T.border}`}}>
      <div>
        <div style={{fontSize:14,fontWeight:500}}>{label}</div>
        {sub && <div style={{fontSize:12,color:T.muted,marginTop:2}}>{sub}</div>}
      </div>
      <Toggle on={form[k]} onChange={tog(k)}/>
    </div>
  );

  const TERMS_OPTIONS = [
    t("settings.termsImmediate"),
    t("settings.terms7"),
    t("settings.terms14"),
    t("settings.terms30"),
  ];

  return (
    <PageShell title={t("settings.title")}>
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,marginBottom:24}}>
        <TabBtn id="account"  label={t("settings.account")}/>
        <TabBtn id="payment"  label={t("settings.payment")}/>
        <TabBtn id="notifs"   label={t("settings.notifications")}/>
        <TabBtn id="plan"     label={t("settings.plan")}/>
        <TabBtn id="language" label={t("settings.language")}/>
      </div>

      <div style={{maxWidth:540}}>

        {/* ── ACCOUNT ── */}
        {tab==="account" && (
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:16,
              marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
              <Avatar name={form.name||"?"} size={56}/>
              <div>
                <div style={{fontWeight:700,fontSize:16}}>{form.name||t("settings.yourName")}</div>
                <div style={{fontSize:13,color:T.muted}}>{form.trade}</div>
              </div>
            </div>
            <FieldRow>
              <Field label={t("settings.fullName")} flex="1">
                <input style={iStyle} value={form.name} onChange={fld("name")}/>
              </Field>
              <Field label={t("settings.profession")} flex="1">
                <select style={iStyle} value={form.trade} onChange={fld("trade")}>
                  {Object.values(VERTICALS).filter(v=>v.id!=="other").map(v => (
                    <optgroup key={v.id} label={`${v.icon}  ${v.label}`}>
                      {v.professions.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {form.trade && (() => {
                  const v = getVerticalForProfession(form.trade);
                  return (
                    <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>
                      <span style={{ background:v.color.bg, color:v.color.text, borderRadius:999, padding:"2px 8px", fontWeight:600 }}>
                        {v.icon} {v.label}
                      </span>
                    </div>
                  );
                })()}
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label={t("settings.email")} flex="1">
                <input type="email" style={iStyle} value={form.email} onChange={fld("email")}/>
              </Field>
              <Field label={t("settings.phone")} flex="1">
                <input style={iStyle} value={form.phone} onChange={fld("phone")}/>
              </Field>
            </FieldRow>
            <Field label={t("settings.bio")}>
              <textarea style={{...iStyle,height:80,resize:"vertical"}}
                value={form.bio} onChange={fld("bio")}
                placeholder={t("settings.bioPlaceholder")}/>
            </Field>
            <FieldRow>
              <Field label={t("settings.hourlyRate")} flex="1">
                <input type="number" style={iStyle} value={form.hourly_rate}
                  onChange={fld("hourly_rate")} min="0"/>
              </Field>
              <Field label={t("settings.bookingSlug")} flex="1">
                <input style={iStyle} value={form.booking_slug} onChange={fld("booking_slug")}
                  placeholder="yourname"/>
              </Field>
            </FieldRow>
            <Field label={t("settings.googleReviewUrl")}>
              <input style={iStyle} value={form.google_review_url} onChange={fld("google_review_url")}
                placeholder={t("settings.googleReviewUrlPlaceholder")}/>
              <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>{t("settings.googleReviewUrlHint")}</div>
            </Field>
            <Divider/>

            {fields.length > 0 && (
              <>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>
                  {t("settings.verticalDetails",{vertical:getVerticalForProfession(form.trade).label})}
                </div>
                <p style={{ fontSize:13, color:T.muted, marginBottom:16 }}>
                  {t("settings.verticalSub")}
                </p>
                {fields.map(field => (
                  <VerticalField key={field.key} field={field} value={form.extra_fields[field.key]} onChange={exFld(field.key)} t={t}/>
                ))}
                <Divider/>
              </>
            )}

            <Btn onClick={save} disabled={saving}>
              {saving ? t("common.saving") : t("settings.saveAccount")}
            </Btn>
          </Card>
        )}

        {/* ── PAYMENT ── */}
        {tab==="payment" && (
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>{t("settings.currencyTitle")}</div>
            <Field label={t("settings.currencyLabel")}>
              <select style={iStyle} value={form.currency} onChange={fld("currency")}>
                {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                  <option key={code} value={code}>
                    {code} ({symbol.trim()})
                  </option>
                ))}
              </select>
            </Field>

            <Divider/>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>{t("settings.bankDetails")}</div>
            <Field label={t("settings.bankName")}>
              <input style={iStyle} value={form.bank_name} onChange={fld("bank_name")}
                placeholder="Barclays Business"/>
            </Field>
            <FieldRow>
              <Field label={t("settings.sortCode")} flex="1">
                <input style={iStyle} value={form.sort_code} onChange={fld("sort_code")}
                  placeholder="20-12-34"/>
              </Field>
              <Field label={t("settings.accountNumber")} flex="1">
                <input style={iStyle} value={form.account_number} onChange={fld("account_number")}
                  placeholder="12345678"/>
              </Field>
            </FieldRow>
            <Divider/>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>{t("settings.invoiceDefaults")}</div>
            <Field label={t("settings.paymentTerms")}>
              <select style={iStyle} value={form.payment_terms} onChange={fld("payment_terms")}>
                {TERMS_OPTIONS.map(o=><option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label={t("settings.invoiceNotes")}>
              <textarea style={{...iStyle,height:72,resize:"vertical"}}
                value={form.invoice_notes} onChange={fld("invoice_notes")}
                placeholder={t("settings.invoiceNotesPlaceholder")}/>
            </Field>
            <Divider/>
            <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Stripe</div>
            <div style={{fontSize:13,color:T.muted,marginBottom:14}}>
              {t("settings.stripeDesc")}
            </div>
            <Btn variant="ghost">{t("settings.connectStripe")}</Btn>
            <Divider/>
            <Btn onClick={save} disabled={saving}>
              {saving ? t("common.saving") : t("settings.savePayment")}
            </Btn>
          </Card>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab==="notifs" && (
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>{t("settings.notifTitle")}</div>
            <SettingRow label={t("settings.notifEmail")}   sub={t("settings.notifEmailSub")}   k="notif_email_booking"/>
            <SettingRow label={t("settings.notifSms")}     sub={t("settings.notifSmsSub")}     k="notif_sms_paid"/>
            <SettingRow label={t("settings.notifDigest")}  sub={t("settings.notifDigestSub")}  k="notif_weekly_digest"/>
            <SettingRow label={t("settings.notifOverdue")} sub={t("settings.notifOverdueSub")} k="notif_overdue_reminder"/>
            <div style={{marginTop:16}}>
              <Btn onClick={save} disabled={saving}>
                {saving ? t("common.saving") : t("settings.savePreferences")}
              </Btn>
            </div>
          </Card>
        )}

        {/* ── PLAN ── */}
{tab === "plan" && (
  <div>
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {t("settings.currentPlan")}
          </div>
          <Badge color={profile?.plan === "pro" ? "brand" : "gray"}>
            {profile?.plan === "pro" ? t("common.pro") : t("common.free")}
          </Badge>
          {profile?.plan === "pro" && (
            <span style={{ fontSize: 13, color: T.green, marginLeft: 10 }}>
              · {t("settings.renewsMonthly")}
            </span>
          )}
        </div>
        {profile?.plan === "pro" && (
          <Btn variant="ghost" size="sm">
            {t("settings.manageBilling")}
          </Btn>
        )}
      </div>
    </Card>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {[
        {
          id: "free",
          name: t("common.free"),
          price: "€0/mo",
          feats: [
            t("settings.freeFeatServices"),     // e.g., "Basic service management"
            t("settings.freeFeatCerts"),        // e.g., "Up to 2 certifications displayed"
            t("settings.freeFeatBooking"),      // e.g., "Standard public booking link"
            t("settings.freeFeatSupport"),      // e.g., "Community support"
          ],
        },
        {
          id: "pro",
          name: t("common.pro"),
          price: "€10/mo",
          hi: true,
          feats: [
            t("settings.proFeatServices"),      // e.g., "Unlimited services & custom options"
            t("settings.proFeatCerts"),         // e.g., "Unlimited certifications & badges"
            t("settings.proFeatCustomDomain"),  // e.g., "Custom branding & custom slug"
            t("settings.proFeatPrioritySlot"),  // e.g., "Advanced slot & availability controls"
            t("settings.proFeatAnalytics"),     // e.g., "Client request & booking analytics"
            t("settings.proFeatSupport"),       // e.g., "Priority support"
          ],
        },
      ].map((p) => (
        <div
          key={p.id}
          style={{
            background: T.surface,
            borderRadius: T.r.lg,
            border: p.hi ? `2px solid ${T.brand}` : `1px solid ${T.border}`,
            padding: 24,
            position: "relative",
            ...(profile?.plan === p.id && { background: T.brandLight }),
          }}
        >
          {p.hi && (
            <div
              style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                background: T.brand,
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 14px",
                borderRadius: T.r.full,
                whiteSpace: "nowrap",
              }}
            >
              {t("settings.mostPopular")}
            </div>
          )}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: -1,
              marginBottom: 4,
              color: p.hi ? T.brand : T.text,
            }}
          >
            {p.price}
          </div>
          <Divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {p.feats.map((f) => (
              <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: T.muted }}>
                <span style={{ color: p.hi ? T.brand : T.green }}>✓</span>
                {f}
              </div>
            ))}
          </div>
          {profile?.plan === p.id ? (
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: T.brand }}>
              {t("settings.currentPlanBadge")}
            </div>
          ) : (
            <Btn
              fullWidth
              onClick={() => p.id === "pro" && toast(t("settings.redirectingStripe"))}
            >
              {p.id === "pro" ? t("settings.upgrade") : t("settings.downgrade")}
            </Btn>
          )}
        </div>
      ))}
    </div>
  </div>
)}
               
        {/* ── LANGUAGE ── */}
        {tab==="language" && (
          <Card>
            <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{t("settings.languageTitle")}</div>
            <p style={{fontSize:13,color:T.muted,marginBottom:20}}>{t("settings.languageSub")}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={()=>setLanguage(l.code)}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"16px 20px", borderRadius:T.r.lg,
                    border:`2px solid ${lang===l.code?T.brand:T.border}`,
                    background:lang===l.code?T.brandLight:T.surface,
                    cursor:"pointer", textAlign:"left",
                  }}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:lang===l.code?T.brand:T.text}}>{l.nativeLabel}</div>
                    <div style={{fontSize:13,color:T.muted,marginTop:2}}>{l.label}</div>
                  </div>
                  {lang===l.code && <span style={{fontSize:18,color:T.brand}}>✓</span>}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function VerticalField({ field, value, onChange, t }) {
  if (field.type === "boolean") {
    return (
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14 }}>
        <input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)}
          style={{ marginTop:3, width:16, height:16, accentColor:T.brand }}/>
        <div>
          <div style={{ fontSize:14, fontWeight:500 }}>{field.label}</div>
          {field.helpText && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{field.helpText}</div>}
        </div>
      </div>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const addItem    = () => onChange([...items, {}]);
    const removeItem = idx => onChange(items.filter((_,i)=>i!==idx));
    const updateItem = (idx, key, val) => onChange(items.map((it,i)=> i===idx ? {...it,[key]:val} : it));
    return (
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:13, fontWeight:500, color:T.muted, marginBottom:8 }}>{field.label}</div>
        {items.map((item, idx) => (
          <div key={idx} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-end" }}>
            {field.itemFields.map(itf => (
              <div key={itf.key} style={{ flex:1 }}>
                <input style={iStyle} value={item[itf.key]??""} placeholder={itf.placeholder}
                  onChange={e=>updateItem(idx, itf.key, e.target.value)}/>
              </div>
            ))}
            <button type="button" onClick={()=>removeItem(idx)}
              style={{ border:"none", background:"none", color:T.muted, cursor:"pointer", fontSize:18, padding:"0 6px" }}>
              ×
            </button>
          </div>
        ))}
        <Btn variant="ghost" size="sm" onClick={addItem}>
          + {t("common.add")} {field.label.toLowerCase().replace(/s$/,"")}
        </Btn>
      </div>
    );
  }

  return (
    <Field label={field.label}>
      <input style={iStyle} value={value??""} placeholder={field.placeholder} onChange={e=>onChange(e.target.value)}/>
    </Field>
  );
}