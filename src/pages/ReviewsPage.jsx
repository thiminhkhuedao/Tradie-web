// src/pages/ReviewsPage.jsx
// Reviews are the moat. 100K verified reviews = impossible to replicate.
// Features: request reviews after jobs, track ratings, push to Google.
import { useState } from "react";
import { useTranslation } from "../i18n/index.js";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import { uid } from "../lib/state";
import {
  PageShell, Card, Btn, Badge, Empty,
  Modal, Field, FormActions, SectionTitle, Divider,
} from "../components/UI";

const fmt = n => `£${Number(n||0).toFixed(2)}`;
const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return "—"; }};

function Stars({ rating, size = 16 }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize:size, color:n<=rating?"#F59E0B":"#E5E3DE" }}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsPage({ state, dispatch, profile }) {
  const { t } = useTranslation();
  const [modal,   setModal]   = useState(null); // null|"request"|"add_manual"
  const [selJob,  setSelJob]  = useState("");
  const [form,    setForm]    = useState({ client_name:"", client_email:"", client_phone:"", rating:5, title:"", body:"" });
  const fld = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const reviews  = state?.reviews ?? [];
  const jobs     = (state?.jobs ?? []).filter(j=>j.status==="completed");
  const clients  = state?.clients ?? [];

  const avgRating   = reviews.length > 0 ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : "—";
  const googleClicks= reviews.filter(r=>r.google_review_clicked).length;
  const verified    = reviews.filter(r=>r.verified).length;

  const getClient = id => clients.find(c=>c.id===id);

  async function sendRequest() {
    const job = jobs.find(j=>j.id===selJob);
    if (!job) { toast.error(t("reviews.toast.selectCompletedJob")); return; }
    const cl = getClient(job.client_id);
    if (!cl?.email) { toast.error("This client has no email address on file."); return; }

    const tid = toast.loading("Sending review request...");
    try {
      const apiKey = import.meta.env.VITE_RESEND_API_KEY;
      if (apiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from:    "Tradie Reviews <noreply@tradie.app>",
            to:      [cl.email],
            subject: `How was your experience with ${profile?.name}?`,
            html: `
              <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;">
                <h2 style="font-size:22px;font-weight:800;margin-bottom:12px;">
                  Hi ${cl.name}, hope everything went well!
                </h2>
                <p style="font-size:15px;color:#6B6460;line-height:1.7;margin-bottom:24px;">
                  ${profile?.name} would really appreciate if you could leave a quick review. It only takes 60 seconds and helps a lot.
                </p>
                <a href="${googleUrl}" style="display:inline-block;background:#E8500A;color:#fff;padding:14px 28px;border-radius:6px;font-weight:700;font-size:15px;text-decoration:none;">
                  Leave a Google review →
                </a>
                <p style="font-size:13px;color:#A39C8C;margin-top:24px;">
                  Thank you for your trust!<br/>${profile?.name}
                </p>
              </div>
            `,
          }),
        });
      }
      toast.dismiss(tid);
      toast.success(t("reviews.toast.requestSent", { name: cl?.name ?? "" }));
      setModal(null);
    } catch (err) {
      toast.dismiss(tid);
      toast.error("Failed to send — check your Resend API key.");
      console.error("[review request]", err);
    }
  }

  function addManual(e) {
    e.preventDefault();
    if (!form.client_name || !form.rating) { toast.error(t("reviews.toast.nameRatingRequired")); return; }
    dispatch({ type:"ADD_REVIEW", payload:{
      id: uid(), profile_id:profile?.id,
      job_id: null, client_id: null,
      client_name: form.client_name,
      client_email: form.client_email,
      rating: Number(form.rating),
      title: form.title,
      body: form.body,
      verified: true,
      google_review_clicked: false,
      created_at: new Date().toISOString(),
    }});
    toast.success(t("reviews.toast.reviewAdded"));
    setModal(null);
    setForm({ client_name:"", client_email:"", client_phone:"", rating:5, title:"", body:"" });
  }

  const iStyle = { width:"100%",padding:"10px 12px",borderRadius:T.r.md,border:`1px solid ${T.borderMed}`,fontSize:14,background:T.surface,color:T.text,boxSizing:"border-box",fontFamily:"inherit" };

  const googleUrl = profile?.extra_fields?.google_place_id
    ? `https://g.page/r/${profile.extra_fields.google_place_id}/review`
    : `https://www.google.com/search?q=${encodeURIComponent((profile?.name||"") + " " + (profile?.trade||""))}`;

  return (
    <PageShell title={t("reviews.title")}
      action={
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="ghost" size="sm" onClick={()=>setModal("add_manual")}>{t("reviews.addManuallyBtn")}</Btn>
          <Btn size="sm" onClick={()=>setModal("request")}>📱 {t("reviews.requestReviewBtn")}</Btn>
        </div>
      }
    >

      {/* Request review modal */}
      {modal==="request" && (
        <Modal title={t("reviews.requestModal.title")} onClose={()=>setModal(null)} width={440}>
          <div style={{ fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.6 }}>
            {t("reviews.requestModal.intro")}
          </div>
          <Field label={t("reviews.requestModal.completedJobLabel")}>
            <select style={iStyle} value={selJob} onChange={e=>setSelJob(e.target.value)}>
              <option value="">{t("reviews.requestModal.selectJobPlaceholder")}</option>
              {jobs.map(j=>{
                const cl = getClient(j.client_id);
                return <option key={j.id} value={j.id}>{j.title} — {cl?.name ?? "?"}</option>;
              })}
            </select>
          </Field>
          {selJob && (() => {
            const job = jobs.find(j=>j.id===selJob);
            const cl  = getClient(job?.client_id);
            return (
              <div style={{ background:T.surface2, borderRadius:T.r.md, padding:"12px 14px", marginBottom:14, fontSize:13 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>{t("reviews.requestModal.smsPreviewTitle")}</div>
                <div style={{ color:T.muted, fontStyle:"italic", lineHeight:1.6 }}>
                  {t("reviews.requestModal.smsTemplate", {
                    clientName: cl?.name ?? t("reviews.fallback.clientBracket"),
                    jobTitle: job?.title ?? t("reviews.fallback.work"),
                    urlPreview: googleUrl.slice(0,30),
                    profileName: profile?.name,
                  })}
                </div>
              </div>
            );
          })()}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:14, borderTop:`1px solid ${T.border}` }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>{t("reviews.requestModal.cancel")}</Btn>
            <Btn onClick={sendRequest}>{t("reviews.requestModal.sendSmsBtn")}</Btn>
          </div>
        </Modal>
      )}

      {/* Add manual review */}
      {modal==="add_manual" && (
        <Modal title={t("reviews.manualModal.title")} onClose={()=>setModal(null)}>
          <div style={{ fontSize:13, color:T.muted, marginBottom:14 }}>
            {t("reviews.manualModal.intro")}
          </div>
          <form onSubmit={addManual}>
            <Field label={t("reviews.manualModal.clientNameLabel")}>
              <input style={iStyle} value={form.client_name} onChange={fld("client_name")} placeholder="Sarah Mitchell" autoFocus/>
            </Field>
            <Field label={t("reviews.manualModal.ratingLabel")}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {[1,2,3,4,5].map(n=>(
                  <span key={n} onClick={()=>setForm(p=>({...p,rating:n}))}
                    style={{ fontSize:28, cursor:"pointer", color:n<=form.rating?"#F59E0B":"#E5E3DE" }}>★</span>
                ))}
                <span style={{ fontSize:13, color:T.muted, marginLeft:4 }}>{form.rating}/5</span>
              </div>
            </Field>
            <Field label={t("reviews.manualModal.reviewTitleLabel")}>
              <input style={iStyle} value={form.title} onChange={fld("title")} placeholder={t("reviews.manualModal.reviewTitlePlaceholder")}/>
            </Field>
            <Field label={t("reviews.manualModal.reviewTextLabel")}>
              <textarea style={{...iStyle,height:80,resize:"vertical"}} value={form.body} onChange={fld("body")} placeholder={t("reviews.manualModal.reviewTextPlaceholder")}/>
            </Field>
            <FormActions onCancel={()=>setModal(null)} submitLabel={t("reviews.manualModal.addReviewBtn")}/>
          </form>
        </Modal>
      )}

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        {/* Average rating big card */}
        <div style={{ background:T.surface, borderRadius:T.r.lg, border:`1px solid ${T.border}`, padding:"20px 24px", display:"flex", alignItems:"center", gap:20, flex:1 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, fontWeight:900, color:T.text, letterSpacing:-2, lineHeight:1 }}>{avgRating}</div>
            <Stars rating={Math.round(Number(avgRating)||0)} size={18}/>
            <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{t("reviews.stats.reviewsCount", { count: reviews.length })}</div>
          </div>
          <div style={{ flex:1 }}>
            {[5,4,3,2,1].map(star=>{
              const count = reviews.filter(r=>r.rating===star).length;
              const pct   = reviews.length>0 ? (count/reviews.length)*100 : 0;
              return (
                <div key={star} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:12, color:T.muted, width:8 }}>{star}</span>
                  <span style={{ color:"#F59E0B", fontSize:12 }}>★</span>
                  <div style={{ flex:1, height:6, background:T.surface3, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:"#F59E0B", borderRadius:3 }}/>
                  </div>
                  <span style={{ fontSize:12, color:T.muted, width:16 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, flex:1 }}>
          {[
            { label:t("reviews.metrics.verifiedReviews"), val:verified, sub:t("reviews.metrics.onYourProfile"), icon:"✅" },
            { label:t("reviews.metrics.googleClicks"), val:googleClicks, sub:t("reviews.metrics.tappedGoogleLink"), icon:"🔍" },
            { label:t("reviews.metrics.jobsWithNoReview"), val:jobs.length-reviews.length, sub:t("reviews.metrics.couldRequestReview"), icon:"📱" },
          ].map(m=>(
            <div key={m.label} style={{ background:T.surface, borderRadius:T.r.lg, border:`1px solid ${T.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:22 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize:22, fontWeight:800 }}>{m.val}</div>
                <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{m.label}</div>
                <div style={{ fontSize:12, color:T.muted }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Business CTA */}
      <div style={{ background:T.blueBg, border:`1px solid ${T.blue}30`, borderRadius:T.r.lg, padding:"14px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight:700, color:T.blue, marginBottom:2 }}>🔍 {t("reviews.googleCta.title")}</div>
          <div style={{ fontSize:13, color:T.muted }}>{t("reviews.googleCta.description")}</div>
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>window.open("https://business.google.com","_blank")}>{t("reviews.googleCta.openBtn")}</Btn>
      </div>

      {/* Reviews list */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        {reviews.length===0
          ? <Empty icon="⭐" message={t("reviews.list.empty")} action={<Btn size="sm" onClick={()=>setModal("request")}>{t("reviews.list.requestFirst")}</Btn>}/>
          : reviews.map(r=>(
              <div key={r.id} style={{ padding:"18px 24px", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:T.brand, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0 }}>
                      {(r.client_name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{r.client_name}</div>
                      <div style={{ fontSize:12, color:T.muted }}>{fmtDate(r.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Stars rating={r.rating} size={15}/>
                    {r.verified && <Badge color="green">{t("reviews.list.verifiedBadge")}</Badge>}
                    {r.google_review_clicked && <Badge color="blue">{t("reviews.list.onGoogleBadge")}</Badge>}
                  </div>
                </div>
                {r.title && <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{r.title}</div>}
                {r.body  && <div style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>{r.body}</div>}
                {!r.google_review_clicked && (
                  <div style={{ marginTop:10 }}>
                    <Btn size="sm" variant="ghost"
                      onClick={()=>{ dispatch({type:"UPDATE_REVIEW",payload:{id:r.id,google_review_clicked:true}}); toast.success(t("reviews.toast.markedPushedToGoogle")); }}>
                      🔍 {t("reviews.list.askClientToPostBtn")}
                    </Btn>
                  </div>
                )}
              </div>
            ))
        }
      </Card>
    </PageShell>
  );
}