// src/pages/CertificationsPage.jsx
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import { uid } from "../lib/state";
import { useTranslation } from "../i18n/index.js";
import { getTerms } from "../lib/professions.js";
import {
  PageShell, Card, Btn, Badge, Empty,
  Modal, Field, FieldRow, FormActions,
  SectionTitle, Divider,
} from "../components/UI";
import { formatCurrency } from "../lib/currency.js";

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
}

// ── Skeleton loader ────────────────────────────────────
function CertSkeleton() {
  const bar = (w, h=12) => (
    <div style={{ width:w, height:h, borderRadius:4, background:"#E5E3DE", animation:"pulse 1.4s ease-in-out infinite" }}/>
  );
  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      {[1,2,3].map(i => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 24px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ width:40, height:40, borderRadius:T.r.md, background:"#E5E3DE", flexShrink:0, animation:"pulse 1.4s ease-in-out infinite" }}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
            {bar("60%", 14)}
            {bar("40%", 11)}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {bar(48, 28)}
            {bar(48, 28)}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Expiry badge ───────────────────────────────────────
function ExpiryBadge({ expiryDate, t }) {
  const days = daysUntilExpiry(expiryDate);
  if (days === null)  return <Badge color="gray">{t("certifications.noExpiry")}</Badge>;
  if (days < 0)       return <Badge color="red">{t("certifications.status.expired")}</Badge>;
  if (days <= 30)     return <Badge color="red">{t("certifications.status.expiring",{when:`${days}d`})}</Badge>;
  if (days <= 90)     return <Badge color="amber">{t("certifications.status.expiring",{when:`${Math.ceil(days/30)}mo`})}</Badge>;
  return <Badge color="green">{t("certifications.status.active")}</Badge>;
}

const iStyle = {
  width:"100%", padding:"10px 12px", borderRadius:T.r.md,
  border:`1px solid rgba(0,0,0,0.15)`, fontSize:14,
  background:"#fff", color:"#131211",
  boxSizing:"border-box", fontFamily:"inherit",
};

// ── Main component ─────────────────────────────────────
export default function CertificationsPage({ state, dispatch, profile }) {
  const { t }  = useTranslation();
  const fmt = n => formatCurrency(n, profile?.currency);
  const terms  = getTerms(profile?.trade);

  const [modal,   setModal]   = useState(null);
  const [delId,   setDelId]   = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(false);
  const fld = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const certs   = state?.certifications ?? [];
  const active  = certs.filter(c => c.status === "active");
  const expired = certs.filter(c => c.status === "expired" || daysUntilExpiry(c.expiry_date) < 0);
  const expiring= active.filter(c => { const d = daysUntilExpiry(c.expiry_date); return d !== null && d <= 90 && d >= 0; });

  function openAdd()  { setForm({ name:"", issuing_body:"", cert_number:"", issued_date:"", expiry_date:"", status:"active" }); setModal("add"); }
  function openEdit(c){ setForm({...c}); setModal("edit"); }

  async function save(e) {
    e.preventDefault();
    if (!form.name) {
      toast.error(t("certifications.nameRequired",{credential:terms.credential}));
      return;
    }

    const days   = daysUntilExpiry(form.expiry_date);
    const status = !form.expiry_date ? "active" : days < 0 ? "expired" : "active";
    const payload = { ...form, status };

    setSaving(true);
    // Optimistic update
    if (modal === "add") {
      const optimistic = { ...payload, id:`temp-${Date.now()}`, profile_id:profile?.id, created_at:new Date().toISOString() };
      dispatch({ type:"ADD_CERT", payload:optimistic });
      try {
        // Real DB call would go here
        toast.success(t("certifications.addedToast"));
      } catch {
        // Rollback
        dispatch({ type:"DELETE_CERT", payload:optimistic.id });
        toast.error(t("certifications.errorAdd"));
        setSaving(false);
        return;
      }
    } else {
      const prev = certs.find(c => c.id === form.id);
      dispatch({ type:"UPDATE_CERT", payload });
      try {
        toast.success(t("common.success"));
      } catch {
        dispatch({ type:"UPDATE_CERT", payload:prev });
        toast.error(t("certifications.errorUpdate"));
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setModal(null);
  }

  function doDelete() {
    const prev = certs.find(c => c.id === delId);
    dispatch({ type:"DELETE_CERT", payload:delId });
    setDelId(null);
    // Show undo toast
    toast.success(t("certifications.removedToast"), {
      duration:4000,
      action: {
        label: t("common.undo"),
        onClick: () => dispatch({ type:"ADD_CERT", payload:prev }),
      },
    });
  }

  return (
    <PageShell
      title={terms.credentialPlural}
      action={<Btn size="sm" onClick={openAdd}>{t("certifications.add")} {terms.credential.toLowerCase()}</Btn>}
    >
      {/* Add / Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add"
            ? `${t("certifications.add")} ${terms.credential.toLowerCase()}`
            : `${t("common.edit")} ${terms.credential.toLowerCase()}`}
          onClose={() => setModal(null)}>
          <form onSubmit={save}>
            <Field label={t("certifications.certName")}>
              <input style={iStyle} value={form.name||""} onChange={fld("name")}
                placeholder={t("certifications.enterName")} autoFocus/>
            </Field>
            <FieldRow>
              <Field label={t("certifications.issuingBody")} flex="1">
                <input style={iStyle} value={form.issuing_body||""} onChange={fld("issuing_body")} placeholder="e.g. NICEIC"/>
              </Field>
              <Field label={t("certifications.certNumber")} flex="1">
                <input style={iStyle} value={form.cert_number||""} onChange={fld("cert_number")} placeholder="e.g. NIC-2024-18E-77821"/>
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label={t("certifications.issueDate")} flex="1">
                <input type="date" style={iStyle} value={form.issued_date||""} onChange={fld("issued_date")}/>
              </Field>
              <Field label={t("certifications.expiryDate")} flex="1">
                <input type="date" style={iStyle} value={form.expiry_date||""} onChange={fld("expiry_date")}/>
              </Field>
            </FieldRow>
            <FormActions
              onCancel={() => setModal(null)}
              submitLabel={modal === "add" ? t("certifications.addCertificate") : t("certifications.saveChanges")}
              loading={saving}/>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {delId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", width:360, boxShadow:"0 24px 64px rgba(0,0,0,0.14)" }}>
            <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700 }}>{t("certifications.removeConfirmTitle")}</h3>
            <p style={{ color:T.muted, fontSize:14, marginBottom:20 }}>{t("certifications.removeConfirmMessage")}</p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={() => setDelId(null)}>{t("common.cancel")}</Btn>
              <Btn variant="danger" onClick={doDelete}>{t("common.remove")}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Expiry alert banner */}
      {expiring.length > 0 && (
        <div style={{ background:T.amberBg, border:`1px solid ${T.amber}40`, borderRadius:T.r.lg, padding:"14px 20px", marginBottom:16 }}>
          <div style={{ fontWeight:700, color:T.amber, marginBottom:4 }}>
            {t("certifications.expiringSoonBanner",{count:expiring.length, plural:expiring.length>1?"s":""})}
          </div>
          <div style={{ fontSize:13, color:T.muted }}>
            {expiring.map(c=>`${c.name} (${Math.ceil(daysUntilExpiry(c.expiry_date)/30)} ${t("certifications.monthsShort")})`).join(" · ")}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        {[
          { label:t("certifications.activeCerts"),    val:active.length,   color:"green" },
          { label:t("certifications.expiringSoon"),   val:expiring.length, color:"amber" },
          { label:t("certifications.expiredLabel"),   val:expired.length,  color:"red"   },
          { label:t("certifications.visibleOnProfile"),val:active.length,  color:"blue"  },
        ].map(m => (
          <div key={m.label} style={{ flex:1, background:T.surface, borderRadius:T.r.lg, border:`1px solid ${T.border}`, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:26, fontWeight:800 }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Visibility note */}
      <div style={{ background:T.greenBg, border:`1px solid ${T.green}30`, borderRadius:T.r.lg, padding:"12px 18px", marginBottom:16, fontSize:13, color:T.green }}>
        {t("certifications.visibilityNote",{credentialPlural:terms.credentialPlural.toLowerCase()})}
      </div>

      {/* Certs list */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        {loading ? (
          <CertSkeleton/>
        ) : certs.length === 0 ? (
          <Empty
            message={t("certifications.noneYet")}
            action={<Btn size="sm" onClick={openAdd}>+ {t("certifications.addFirst")}</Btn>}/>
        ) : (
          <>
            {active.length > 0 && (
              <div style={{ padding:"14px 24px 0" }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>
                  {t("certifications.activeSection",{count:active.length})}
                </div>
              </div>
            )}
            {active.map(c => <CertRow key={c.id} cert={c} t={t} onEdit={()=>openEdit(c)} onDelete={()=>setDelId(c.id)}/>)}

            {expired.length > 0 && (
              <div style={{ padding:"14px 24px 4px", borderTop:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.red, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>
                  {t("certifications.expiredSection",{count:expired.length})}
                </div>
              </div>
            )}
            {expired.map(c => <CertRow key={c.id} cert={c} t={t} onEdit={()=>openEdit(c)} onDelete={()=>setDelId(c.id)}/>)}
          </>
        )}
      </Card>
    </PageShell>
  );
}

// ── Cert row ───────────────────────────────────────────
function CertRow({ cert, t, onEdit, onDelete }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 24px", borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:40, height:40, borderRadius:T.r.md, background:cert.status==="expired"?T.redBg:T.greenBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:cert.status==="expired"?T.red:T.green, flexShrink:0 }}>
        {cert.status === "expired" ? "EXP" : "OK"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{cert.name}</div>
        <div style={{ fontSize:12, color:T.muted }}>
          {cert.issuing_body && <span>{cert.issuing_body}</span>}
          {cert.cert_number  && <span> · {cert.cert_number}</span>}
          {cert.expiry_date  && <span> · {t("certifications.expiresLabel")} {new Date(cert.expiry_date).toLocaleDateString("en-GB",{month:"short",year:"numeric"})}</span>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <ExpiryBadge expiryDate={cert.expiry_date} t={t}/>
        <Btn size="sm" variant="ghost" onClick={onEdit}>{t("common.edit")}</Btn>
        <Btn size="sm" variant="danger" onClick={onDelete}>{t("common.remove")}</Btn>
      </div>
    </div>
  );
}