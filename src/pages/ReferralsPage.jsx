// src/pages/ReferralsPage.jsx

import { useState } from "react";
import { useTranslation } from "../i18n/index.js";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";
import { T } from "../styles/tokens";
import { uid } from "../lib/state";
import {
  PageShell, Card, Btn, Badge, Table, TD,
  Modal, Field, SectionTitle, Empty, MetricCard, Divider,
} from "../components/UI";

const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return "—"; }};

const STATUS_COLOR = { pending:"gray", signed_up:"blue", qualified:"amber", rewarded:"green" };

export default function ReferralsPage({ state, dispatch, profile }) {
  const { t } = useTranslation();
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ name:"", email:"" });
  const [copied,   setCopied]   = useState(false);

  const referrals = state?.referrals ?? [];
  const rewarded  = referrals.filter(r=>r.status==="rewarded").length;
  const pending   = referrals.filter(r=>r.status==="pending").length;
  const monthsFree= rewarded * 2;

  // Generate a stable personal referral link for sharing
  const myCode    = `TRD-${(profile?.name||"USER").replace(/\s/g,"").slice(0,4).toUpperCase()}${profile?.id?.slice(0,4)?.toUpperCase()||"0000"}`;
  const referralUrl = `https://tradie.app/signup?ref=${myCode}`;

  async function copyLink() {
    const ok = await copyToClipboard(referralUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("referrals.toast.linkCopied"));
    } else {
      toast.error(t("referrals.toast.copyFailedManual"));
    }
  }

  function sendReferral(e) {
    e.preventDefault();
    if (!form.email) { toast.error(t("referrals.toast.emailRequired")); return; }
    const code = `TRD-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    dispatch({ type:"ADD_REFERRAL", payload:{
      id:uid(), referrer_id:profile?.id,
      referral_code: code,
      referred_email: form.email,
      referred_name:  form.name,
      status:"pending",
      reward_months:2,
      rewarded_at:null,
      created_at:new Date().toISOString(),
    }});
    toast.success(t("referrals.toast.referralSent", { email: form.email }));
    setForm({ name:"", email:"" });
    setModal(false);
  }

  const iStyle = { width:"100%",padding:"10px 12px",borderRadius:T.r.md,border:`1px solid ${T.borderMed}`,fontSize:14,background:T.surface,color:T.text,boxSizing:"border-box",fontFamily:"inherit" };

  return (
    <PageShell title={t("referrals.title")}
      action={<Btn size="sm" onClick={()=>setModal(true)}>{t("referrals.referSomeoneBtn")}</Btn>}
    >

      {modal && (
        <Modal title={t("referrals.modal.title")} onClose={()=>setModal(false)} width={420}>
          <p style={{ fontSize:13, color:T.muted, marginBottom:18, lineHeight:1.6 }}>
            {t("referrals.modal.intro")}
          </p>
          <form onSubmit={sendReferral}>
            <Field label={t("referrals.modal.theirNameLabel")}>
              <input style={iStyle} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Pete Larkin" autoFocus/>
            </Field>
            <Field label={t("referrals.modal.theirEmailLabel")}>
              <input type="email" style={iStyle} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="pete@plumbing.co.uk"/>
            </Field>
            <div style={{ background:T.brandLight, borderRadius:T.r.md, padding:"12px 14px", marginBottom:16, fontSize:13, color:T.brand, lineHeight:1.6 }}>
              {t("referrals.modal.giftNote")}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:12, borderTop:`1px solid ${T.border}` }}>
              <Btn variant="ghost" onClick={()=>setModal(false)}>{t("referrals.modal.cancel")}</Btn>
              <Btn type="submit">{t("referrals.modal.send")}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <MetricCard label={t("referrals.metrics.successfulReferrals")} value={rewarded}     sub={t("referrals.metrics.totalSent", { count: referrals.length })} accent/>
        <MetricCard label={t("referrals.metrics.monthsProEarned")}    value={monthsFree}   sub={t("referrals.metrics.appliedToAccount")} />
        <MetricCard label={t("referrals.metrics.pending")}              value={pending}      sub={t("referrals.metrics.waitingToSignUp")} />
        <MetricCard label={t("referrals.metrics.yourReferralCode")}   value={myCode}       sub={t("referrals.metrics.shareThisLink")} />
      </div>

      {/* Share your link */}
      <Card style={{ marginBottom:16 }}>
        <SectionTitle>{t("referrals.linkCard.title")}</SectionTitle>
        <p style={{ fontSize:13, color:T.muted, marginBottom:14, lineHeight:1.6 }}>
          {t("referrals.linkCard.description")}
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, padding:"10px 14px", borderRadius:T.r.md, background:T.surface2, border:`1px solid ${T.border}`, fontSize:13, color:T.muted, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {referralUrl}
          </div>
          <Btn onClick={copyLink} variant={copied?"success":"primary"}>
            {copied ? t("referrals.linkCard.copied") : t("referrals.linkCard.copyLink")}
          </Btn>
        </div>

        <Divider/>

        {/* Share methods */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            { key:"whatsapp", label:t("referrals.share.whatsapp"),  onClick:()=>window.open(`https://wa.me/?text=${encodeURIComponent(t("referrals.share.whatsappMessage", { url: referralUrl }))}`) },
            { key:"facebook", label:t("referrals.share.facebook"),  onClick:()=>window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`) },
            { key:"email", label:t("referrals.share.email"),     onClick:()=>window.open(`mailto:?subject=${encodeURIComponent(t("referrals.share.emailSubject"))}&body=${encodeURIComponent(t("referrals.share.emailBody", { url: referralUrl }))}`) },
          ].map(b=>(
            <Btn key={b.key} variant="ghost" size="sm" onClick={b.onClick}>{b.icon} {b.label}</Btn>
          ))}
        </div>
      </Card>

      {/* How it works */}
      <Card style={{ marginBottom:16, background:T.surface2, border:"none" }}>
        <SectionTitle>{t("referrals.howItWorks.title")}</SectionTitle>
        {["1","2","3","4"].map(num=>(
          <div key={num} style={{ display:"flex", gap:14, padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:T.brand, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>{num}</div>
            <div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{t(`referrals.howItWorks.step${num}.title`)}</div>
              <div style={{ fontSize:13, color:T.muted }}>{t(`referrals.howItWorks.step${num}.desc`)}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Referrals table */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 24px 0" }}><div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>{t("referrals.table.title")}</div></div>
        {referrals.length === 0 ? (
          <Empty message={t("referrals.table.empty")}
            action={<Btn size="sm" onClick={()=>setModal(true)}>{t("referrals.table.referFirst")}</Btn>}/>
        ) : (
          <Table headers={[
            t("referrals.table.headers.name"), t("referrals.table.headers.email"), t("referrals.table.headers.code"),
            t("referrals.table.headers.status"), t("referrals.table.headers.reward"), t("referrals.table.headers.sent"),
          ]}>
            {referrals.map(r=>(
              <tr key={r.id}>
                <TD style={{ fontWeight:500 }}>{r.referred_name||"—"}</TD>
                <TD style={{ color:T.muted }}>{r.referred_email||"—"}</TD>
                <TD><code style={{ fontSize:12, background:T.surface2, padding:"2px 8px", borderRadius:4 }}>{r.referral_code}</code></TD>
                <TD>
                  <div>
                    <Badge color={STATUS_COLOR[r.status]||"gray"}>{t(`referrals.status.${r.status}`)}</Badge>
                    <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{t(`referrals.statusDesc.${r.status}`)}</div>
                  </div>
                </TD>
                <TD style={{ fontWeight:600, color:r.status==="rewarded"?T.green:T.muted }}>
                  {r.status==="rewarded" ? t("referrals.table.rewardMonths", { count: r.reward_months }) : "—"}
                </TD>
                <TD style={{ color:T.muted }}>{fmtDate(r.created_at)}</TD>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </PageShell>
  );
}
