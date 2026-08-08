// src/pages/BookingPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import { getBookingRequests, updateBookingStatus, getServices, createService, updateService, deleteService } from "../lib/db";
import { supabase } from "../lib/supabase";
import { sendNewBookingSMS } from "../lib/notifications";
import { getTerms, getVerticalColor, getVerticalForProfession } from "../lib/professions.js";
import { useTranslation } from "../i18n/index.js";
import {
 PageShell, Card, Btn, Badge,
 Field, FieldRow, SectionTitle, Avatar, Empty,
} from "../components/UI";
import ServiceEditor from "../components/ServiceEditor";

const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return d||""; } };
const fmt = n => `£${Number(n||0).toLocaleString("en-GB",{minimumFractionDigits:2})}`;

export default function BookingPage({ profile }) {
 const { t } = useTranslation();
 const terms = getTerms(profile?.trade);
 const verticalColor = getVerticalColor(profile?.trade);
 const vertical = getVerticalForProfession(profile?.trade);
 const [bookings, setBookings] = useState([]);
 const [loading, setLoading] = useState(true);
 const [view, setView] = useState("requests");
 const [certs, setCerts] = useState([]);
 const [previewForm, setPreviewForm] = useState({ customer_name:"", customer_email:"", customer_phone:"", preferred_date:"", notes:"" });
 const [previewDone, setPreviewDone] = useState(false);
 const pfld = k => e => setPreviewForm(p=>({...p,[k]:e.target.value}));

 const load = useCallback(async () => {
 if (!profile?.id) return;
 setLoading(true);
 const [{ data: b }, { data: c }] = await Promise.all([
 getBookingRequests(profile.id),
 supabase.from("certifications").select("*").eq("profile_id", profile.id).neq("status","expired"),
 ]);
 setBookings(b ?? []);
 setCerts(c ?? []);
 setLoading(false);
 }, [profile?.id]);

 useEffect(() => { load(); }, [load]);

 // Accept or decline a booking request
 async function respond(id, status) {
 const { data, error } = await updateBookingStatus(id, status);
 if (error) { toast.error(t("booking.updateFailed")); return; }
 setBookings(prev => prev.map(b => b.id===id ? data : b));
 toast.success(status==="accepted" ? t("booking.acceptedToast") : t("booking.declinedToast"));
 }

 // Submit a booking from the preview form (simulating a customer)
 async function submitPreview(e) {
 e.preventDefault();
 if (!previewForm.customer_name || !previewForm.preferred_date) {
 toast.error(t("booking.nameAndDateRequired")); return;
 }
 const { data, error } = await submitBookingRequest(profile.id, previewForm);
 if (error) { toast.error(t("booking.submitFailed")); return; }
 setBookings(prev => [data, ...prev]);
 setPreviewDone(true);
 toast.success(t("booking.submittedToast"));

 // Notify tradesperson by SMS
 if (profile?.phone && profile?.notif_sms_new_booking !== false) {
 sendNewBookingSMS(data, profile); // fire and forget
 }
 }

 const pending = bookings.filter(b=>b.status==="pending");
 const accepted = bookings.filter(b=>b.status==="accepted");
 const declined = bookings.filter(b=>b.status==="declined");

 const iStyle = {
 width:"100%", padding:"10px 12px", borderRadius:T.r.md,
 border:`1px solid ${T.borderMed}`, fontSize:14,
 background:T.surface, color:T.text,
 boxSizing:"border-box", fontFamily:"inherit",
 };

 const ViewTab = ({ id, label }) => (
 <button onClick={() => setView(id)} style={{
 padding:"8px 18px", border:"none",
 borderBottom: view===id ? `2px solid ${T.brand}` : "2px solid transparent",
 background:"transparent",
 color: view===id ? T.brand : T.muted,
 fontSize:14, fontWeight:view===id?700:400, cursor:"pointer",
 }}>
 {label}{id==="requests"&&pending.length>0?` (${pending.length})`:""}
 </button>
 );

 // Vertical-aware copy for the request form / button, translated per
 // vertical id (trades / beauty / professional / fallback).
 const requestTitleKey = vertical.id==="beauty" ? "booking.requestTitleBeauty"
 : vertical.id==="professional" ? "booking.requestTitleProfessional"
 : "booking.requestTitleTrades";
 const sendButtonKey = vertical.id==="professional" ? "booking.sendRequestProfessional" : "booking.sendRequestGeneric";

 return (
 <PageShell title={t("nav.booking")}>
 {/* Tab bar */}
 <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${T.border}`}}>
 <ViewTab id="requests" label={t("booking.requests")}/>
 <ViewTab id="preview" label={t("booking.preview")}/>
 <ViewTab id="settings" label={t("booking.pageSettings")}/>
 </div>

 {/* ── REQUESTS ── */}
 {view === "requests" && (
 <div>
 {loading && <div style={{textAlign:"center",padding:48,color:T.muted}}>{t("booking.loadingRequests")}</div>}

 {!loading && bookings.length===0 && (
 <Card>
 <Empty icon="" message={t("booking.noRequests")}/>
 </Card>
 )}

 {pending.length > 0 && (
 <div style={{marginBottom:24}}>
 <div style={{...titleStyle, color:T.amber}}>{t("booking.newRequests",{count:pending.length})}</div>
 {pending.map(b => <BookingCard key={b.id} b={b} t={t} onAccept={()=>respond(b.id,"accepted")} onDecline={()=>respond(b.id,"declined")}/>)}
 </div>
 )}
 {accepted.length > 0 && (
 <div style={{marginBottom:24}}>
 <div style={{...titleStyle, color:T.green}}>{t("booking.accepted",{count:accepted.length})}</div>
 {accepted.map(b => <BookingCard key={b.id} b={b} t={t}/>)}
 </div>
 )}
 {declined.length > 0 && (
 <div>
 <div style={{...titleStyle, color:T.hint}}>{t("booking.declined",{count:declined.length})}</div>
 {declined.map(b => <BookingCard key={b.id} b={b} t={t}/>)}
 </div>
 )}
 </div>
 )}

 {/* ── PUBLIC PAGE PREVIEW ── */}
 {view === "preview" && (
 <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:20}}>
 <Card style={{marginBottom:0}}>
 <div style={{display:"flex",alignItems:"center",gap:16,paddingBottom:20,borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
 <Avatar name={profile?.name||"?"} size={60}/>
 <div>
 <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5}}>{profile?.name}</div>
 <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
 <span style={{background:verticalColor.bg,color:verticalColor.text,borderRadius:999,padding:"2px 10px",fontSize:13,fontWeight:600}}>
 {vertical.icon} {profile?.trade}
 </span>
 </div>
 <div style={{display:"flex",gap:12,marginTop:8,fontSize:13,color:T.muted}}>
 <span>{profile?.extra_fields?.certified ? "" : ""} {vertical.id==="professional" ? t("booking.registered") : vertical.id==="beauty" ? t("booking.qualifiedInsured") : t("booking.fullyQualified")}</span>
 <span>⭐ {profile?.reviews_count > 0 ? `${profile.reviews_count} ${t("booking.reviewsLabel")}` : ""}</span>
 </div>
 </div>
 </div>
 <p style={{fontSize:14,color:T.muted,lineHeight:1.7,marginBottom:20}}>{profile?.bio}</p>
 <div style={{display:"flex",gap:12}}>
 <div style={{flex:1,background:T.surface2,borderRadius:T.r.md,padding:"14px 18px"}}>
 <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{terms.rateLabel}</div>
 <div style={{fontSize:22,fontWeight:800,color:profile?.hourly_rate>0?T.brand:T.muted}}>
 {profile?.hourly_rate>0 ? <>{fmt(profile.hourly_rate)}<span style={{fontSize:13,fontWeight:400,color:T.muted}}>{vertical.id==="beauty"?"":"/hr"}</span></> : ""}
 </div>
 </div>
 <div style={{flex:1,background:T.surface2,borderRadius:T.r.md,padding:"14px 18px"}}>
 <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{t("booking.responseLabel")}</div>
 <div style={{fontSize:22,fontWeight:800,color:profile?.response_time?T.text:T.muted}}>
 {profile?.response_time || ""}
 </div>
 </div>
 </div>

 {/* ── Vertical-specific public display ── */}
 {vertical.id==="professional" && (profile?.extra_fields?.bar_number || profile?.extra_fields?.professional_body || profile?.extra_fields?.gdpr_accepted) && (
 <div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${T.border}`}}>
 {profile?.extra_fields?.professional_body && (
 <div style={{fontSize:13,color:T.muted,marginBottom:6}}> {profile.extra_fields.professional_body}</div>
 )}
 {profile?.extra_fields?.bar_number && (
 <div style={{fontSize:13,color:T.muted,marginBottom:6}}>🪪 {profile.extra_fields.bar_number}</div>
 )}
 {profile?.extra_fields?.gdpr_accepted && (
 <div style={{fontSize:12,color:T.green,marginTop:8,display:"flex",alignItems:"center",gap:6}}>
 {t("booking.gdprCompliant")}
 </div>
 )}
 </div>
 )}

 {vertical.id==="trades" && (profile?.extra_fields?.insurance_provider || profile?.extra_fields?.vat_registered) && (
 <div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${T.border}`,display:"flex",gap:16,flexWrap:"wrap"}}>
 {profile?.extra_fields?.insurance_provider && (
 <div style={{fontSize:13,color:T.muted}}>
 ️ {t("booking.insuredVia")} {profile.extra_fields.insurance_provider}
 {profile.extra_fields.insurance_amount && ` (${profile.extra_fields.insurance_amount})`}
 </div>
 )}
 {profile?.extra_fields?.vat_registered && (
 <div style={{fontSize:13,color:T.muted}}> {t("booking.vatRegistered")}</div>
 )}
 </div>
 )}

 {vertical.id==="beauty" && Array.isArray(profile?.extra_fields?.service_menu) && profile.extra_fields.service_menu.length > 0 && (
 <div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${T.border}`}}>
 <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>{t("booking.servicesTitle")}</div>
 {profile.extra_fields.service_menu.map((s,i) => (
 <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.text,padding:"6px 0",borderBottom:i<profile.extra_fields.service_menu.length-1?`1px solid ${T.border}`:"none"}}>
 <span>{s.name}{s.duration && <span style={{color:T.muted}}> · {s.duration} min</span>}</span>
 {s.price && <span style={{fontWeight:600}}>£{s.price}</span>}
 </div>
 ))}
 </div>
 )}

 {/* ── Certifications ── */}
 {certs.length > 0 && (
 <div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${T.border}`}}>
 <div style={{fontSize:13,fontWeight:700,marginBottom:12}}> {t("nav.certifications")}</div>
 {certs.map((c,i)=>(
 <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:T.surface2,borderRadius:T.r.md,marginBottom:8}}>
 <div style={{flex:1}}>
 <div style={{fontSize:13,fontWeight:700}}>{c.name}</div>
 {c.issuing_body && <div style={{fontSize:12,color:T.muted,marginTop:2}}>{c.issuing_body}{c.cert_number?` · #${c.cert_number}`:""}</div>}
 {c.expiry_date && <div style={{fontSize:11,color:T.muted,marginTop:2}}>Expire le {new Date(c.expiry_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>}
 </div>
 <span style={{fontSize:11,fontWeight:700,color:"#059669",background:"#D1FAE5",padding:"2px 8px",borderRadius:100,flexShrink:0}}>Valide</span>
 </div>
 ))}
 </div>
 )}

 {/* ── Coordonnées ── */}
 <div style={{marginTop:20,paddingTop:20,borderTop:`1px solid ${T.border}`}}>
 <div style={{fontSize:13,fontWeight:700,marginBottom:12}}> {t("settings.account")}</div>
 {[
 { icon:"️", label:t("settings.email"), value:profile?.email },
 { icon:"", label:t("settings.phone"), value:profile?.phone },
 ].map(({icon,label,value})=>(
 <div key={label} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
 <span style={{fontSize:16,width:24,flexShrink:0}}>{icon}</span>
 <div style={{flex:1}}>
 <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>
 <div style={{fontSize:13,fontWeight:600,color:value?T.text:T.muted}}>{value||""}</div>
 </div>
 </div>
 ))}
 </div>
 </Card>

 <Card style={{marginBottom:0}}>
 {previewDone ? (
 <div style={{textAlign:"center",padding:"40px 16px"}}>
 <div style={{fontSize:44,marginBottom:12}}></div>
 <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>{t("booking.requestSentTitle")}</div>
 <div style={{fontSize:14,color:T.muted,marginBottom:20}}>{t("booking.requestSentSub",{name:profile?.name})}</div>
 <Btn onClick={() => { setPreviewDone(false); setPreviewForm({customer_name:"",customer_email:"",customer_phone:"",preferred_date:"",notes:""}); }}>
 {t("booking.bookAnother")}
 </Btn>
 </div>
 ) : (
 <form onSubmit={submitPreview}>
 <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>{t(requestTitleKey)}</div>
 <Field label={t("booking.yourName")}><input style={iStyle} value={previewForm.customer_name} onChange={pfld("customer_name")} placeholder="Sarah Mitchell"/></Field>
 <Field label={t("booking.emailLabel")}><input type="email" style={iStyle} value={previewForm.customer_email} onChange={pfld("customer_email")}/></Field>
 <Field label={t("booking.phoneLabel")}><input style={iStyle} value={previewForm.customer_phone} onChange={pfld("customer_phone")}/></Field>
 <Field label={t("booking.preferredDate")}><input type="date" style={iStyle} value={previewForm.preferred_date} onChange={pfld("preferred_date")}/></Field>
 <Field label={vertical.id==="beauty" ? t("booking.whichService") : vertical.id==="professional" ? t("booking.regarding") : t("booking.whatNeeded")}>
 <textarea style={{...iStyle,height:80,resize:"vertical"}} value={previewForm.notes} onChange={pfld("notes")} placeholder={vertical.id==="beauty" ? t("booking.whichService") : vertical.id==="professional" ? t("booking.regarding") : t("booking.whatNeeded")}/>
 </Field>
 <Btn fullWidth size="lg" style={{justifyContent:"center",marginTop:4}}>{t(sendButtonKey)} →</Btn>
 <div style={{fontSize:12,color:T.muted,textAlign:"center",marginTop:10}}>
 {vertical.id==="beauty" ? t("booking.noPaymentBeauty") : vertical.id==="professional" ? t("booking.noPaymentProf") : t("booking.noPayment")}
 </div>
 </form>
 )}
 </Card>
 </div>
 )}

 {/* ── SETTINGS ── */}
 {view === "settings" && (
 <div style={{maxWidth:600}}>
 <ServiceEditor profile={profile}/>
 <AvailabilityEditor profile={profile}/>

 <Card>
 <SectionTitle>{t("booking.urlSectionTitle")}</SectionTitle>
 <div style={{display:"flex",gap:8,marginBottom:20}}>
 <div style={{...iStyle,background:T.surface2,color:T.muted,flex:1,padding:"10px 12px"}}>
 https://Vimen.app/b/{profile?.booking_slug}
 </div>
 <Btn variant="ghost" onClick={() => {
 const url = `https://Vimen.app/b/${profile?.booking_slug}`;
 if (navigator.clipboard) {
 navigator.clipboard.writeText(url).then(()=>toast.success(t("booking.linkCopied")));
 } else {
 // Fallback for HTTP/non-secure contexts (e.g. localhost)
 const el = document.createElement("textarea");
 el.value = url;
 el.style.position = "fixed";
 el.style.opacity = "0";
 document.body.appendChild(el);
 el.select();
 document.execCommand("copy");
 document.body.removeChild(el);
 toast.success(t("booking.linkCopied"));
 }
 }}>{t("booking.copyLink")}</Btn>
 </div>
 <p style={{fontSize:13,color:T.muted,lineHeight:1.6}}>
 {t("booking.shareHint")}
 </p>
 </Card>
 </div>
 )}
 </PageShell>
 );
}

const titleStyle = { fontSize:15, fontWeight:700, marginBottom:10 };

function BookingCard({ b, t, onAccept, onDecline }) {
 const isPending = b.status === "pending";
 return (
 <Card style={{marginBottom:10}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
 <div style={{display:"flex",gap:12,alignItems:"center"}}>
 <Avatar name={b.customer_name} size={40}/>
 <div>
 <div style={{fontWeight:700,fontSize:15}}>{b.customer_name}</div>
 <div style={{fontSize:13,color:T.muted}}>
 {b.customer_email}{b.customer_phone ? ` · ${b.customer_phone}` : ""}
 </div>
 </div>
 </div>
 <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
 <Badge color={b.status==="accepted"?"green":b.status==="declined"?"gray":"amber"}>
 {b.status==="accepted" ? t("booking.status.accepted") : b.status==="declined" ? t("booking.status.declined") : t("booking.status.pending")}
 </Badge>
 {isPending && <>
 <Btn size="sm" variant="success" onClick={onAccept}> {t("booking.accept")}</Btn>
 <Btn size="sm" variant="danger" onClick={onDecline}> {t("booking.decline")}</Btn>
 </>}
 </div>
 </div>
 {b.preferred_date && (
 <div style={{fontSize:13,color:T.muted,marginTop:10}}>
 {t("booking.preferredDateLabel")} <strong>{fmtDate(b.preferred_date)}</strong>
 </div>
 )}
 {b.notes && (
 <div style={{fontSize:13,color:T.text,marginTop:8,
 padding:"10px 14px",background:T.surface2,borderRadius:T.r.md}}>
 {b.notes}
 </div>
 )}
 <div style={{fontSize:11,color:T.hint,marginTop:10}}>
 {t("booking.receivedLabel")} {fmtDate(b.created_at)}
 </div>
 </Card>
 );
}
// ── Availability Editor ────────────────────────────────
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const DEFAULT_HOURS = { start_time:"09:00", end_time:"18:00" };

function AvailabilityEditor({ profile }) {
 const [avail, setAvail] = useState(null);
 const [saving, setSaving] = useState(false);
 const { t } = useTranslation();

 useEffect(() => {
 if (!profile?.id) return;
 supabase.from("availability").select("*").eq("profile_id", profile.id)
 .then(({ data }) => {
 const map = {};
 for (let i=0; i<7; i++) {
 const row = (data||[]).find(a=>a.day_of_week===i);
 map[i] = row
 ? { enabled:true, start_time:row.start_time.slice(0,5), end_time:row.end_time.slice(0,5), id:row.id }
 : { enabled:false, ...DEFAULT_HOURS };
 }
 setAvail(map);
 });
 }, [profile?.id]);

 function toggle(day) {
 setAvail(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
 }

 function setTime(day, field, value) {
 setAvail(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
 }

 async function save() {
 if (!avail || !profile?.id) return;
 setSaving(true);

 // Delete existing rows
 const { error: delErr } = await supabase
 .from("availability")
 .delete()
 .eq("profile_id", profile.id);

 if (delErr) {
 console.error("[availability] delete error:", delErr);
 toast.error("Failed to save " + delErr.message);
 setSaving(false);
 return;
 }

 // Insert enabled days
 const rows = Object.entries(avail)
 .filter(([,v]) => v.enabled)
 .map(([day, v]) => ({
 profile_id: profile.id,
 day_of_week: parseInt(day),
 start_time: v.start_time,
 end_time: v.end_time,
 }));

 if (rows.length > 0) {
 const { error: insErr } = await supabase.from("availability").insert(rows);
 if (insErr) {
 console.error("[availability] insert error:", insErr);
 toast.error("Failed to save " + insErr.message);
 setSaving(false);
 return;
 }
 }

 setSaving(false);
 toast.success(t("booking.availabilitySaved") || "Availability saved ");
 }

 if (!avail) return null;

 const isFr = t("common.save") === "Enregistrer";

 return (
 <Card style={{ marginBottom:16 }}>
 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
 <SectionTitle>{isFr ? "Disponibilités" : "Availability"}</SectionTitle>
 </div>
 <p style={{ fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.6 }}>
 {isFr
 ? "Définissez vos horaires de travail. Les clients ne verront que les créneaux des jours activés."
 : "Set your working hours. Clients will only see time slots on days you've enabled."}
 </p>
 <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
 {DAY_NAMES.map((name, i) => {
 const frNames = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
 const displayName = isFr ? frNames[i] : name;
 return (
 <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:T.r.md, background:avail[i].enabled?T.brandLight:T.surface2, border:`1px solid ${avail[i].enabled?T.brand:T.border}` }}>
 <button onClick={()=>toggle(i)} style={{
 width:40, height:22, borderRadius:11, border:"none", cursor:"pointer", flexShrink:0, position:"relative",
 background:avail[i].enabled?T.brand:T.border, transition:"background .2s",
 }}>
 <span style={{ position:"absolute", top:2, left:avail[i].enabled?20:2, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left .2s", display:"block" }}/>
 </button>
 <div style={{ width:100, fontSize:14, fontWeight:600, color:avail[i].enabled?T.brand:T.muted }}>{displayName}</div>
 {avail[i].enabled ? (
 <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
 <input type="time" value={avail[i].start_time} onChange={e=>setTime(i,"start_time",e.target.value)}
 style={{ padding:"6px 10px", borderRadius:T.r.sm, border:`1px solid ${T.border}`, fontSize:13, fontFamily:"inherit" }}/>
 <span style={{ fontSize:13, color:T.muted }}>{isFr?"à":"to"}</span>
 <input type="time" value={avail[i].end_time} onChange={e=>setTime(i,"end_time",e.target.value)}
 style={{ padding:"6px 10px", borderRadius:T.r.sm, border:`1px solid ${T.border}`, fontSize:13, fontFamily:"inherit" }}/>
 </div>
 ) : (
 <div style={{ fontSize:13, color:T.muted }}>{isFr?"Indisponible":"Unavailable"}</div>
 )}
 </div>
 );
 })}
 </div>
 <Btn onClick={save} disabled={saving}>
 {saving ? t("common.saving") : (isFr ? "Enregistrer les disponibilités" : "Save availability")}
 </Btn>
 </Card>
 );
}