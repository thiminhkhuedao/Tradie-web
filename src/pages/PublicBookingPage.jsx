// src/pages/PublicBookingPage.jsx

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getTerms, getVerticalColor, getVerticalForProfession } from "../lib/professions.js";

const fmt = n => `£${Number(n||0).toLocaleString("en-GB",{minimumFractionDigits:2})}`;
const pad = n => String(n).padStart(2,"0");

const C = {
  brand:"#E8500A", brandLight:"#FFF0EB", surface:"#fff",
  bg:"#FAF9F6", border:"rgba(0,0,0,0.09)", muted:"#6B6460",
  text:"#14171F", green:"#059669", greenBg:"#D1FAE5",
  r:{ sm:6, md:10, lg:16, xl:22 },
  shadow:"0 2px 20px rgba(0,0,0,0.07)",
};

const inp = {
  width:"100%", padding:"11px 14px", borderRadius:C.r.md,
  border:`1px solid ${C.border}`, fontSize:15,
  background:C.surface, color:C.text,
  boxSizing:"border-box", fontFamily:"inherit",
};

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Avatar({ name, size=64 }) {
  const initials = (name||"?").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:C.brand, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${C.border}`, borderTopColor:C.brand, animation:"spin 0.65s linear infinite" }}/>
    </>
  );
}

// Generate time slots between start and end with given duration
function generateSlots(startTime, endTime, durationMins) {
  const slots = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + durationMins <= end) {
    slots.push(`${pad(Math.floor(cur/60))}:${pad(cur%60)}`);
    cur += durationMins;
  }
  return slots;
}

// ── Calendar component ─────────────────────────────────
function Calendar({ availability, blockedSlots, selectedService, onSelectSlot, selectedDate, selectedTime }) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month+1, 0).getDate();
  const duration  = selectedService?.duration_min || 60;

  // Which days of week have availability
  const availDays = new Set((availability||[]).map(a=>a.day_of_week));

  // Blocked slot lookup: "YYYY-MM-DD HH:MM" set
  const blockedSet = new Set((blockedSlots||[]).map(b=>`${b.slot_date} ${b.slot_time.slice(0,5)}`));

  function prevMonth() {
    if (month===0) { setMonth(11); setYear(y=>y-1); }
    else setMonth(m=>m-1);
  }
  function nextMonth() {
    if (month===11) { setMonth(0); setYear(y=>y+1); }
    else setMonth(m=>m+1);
  }

  function getSlots(date) {
    const dow = date.getDay();
    const dayAvail = (availability||[]).filter(a=>a.day_of_week===dow);
    if (!dayAvail.length) return [];
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
    return dayAvail.flatMap(a => generateSlots(a.start_time.slice(0,5), a.end_time.slice(0,5), duration))
      .filter(slot => !blockedSet.has(`${dateStr} ${slot}`))
      .filter((slot,i,arr) => arr.indexOf(slot)===i) // dedupe
      .sort();
  }

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysCount; d++) cells.push(d);

  const selDate  = selectedDate ? new Date(selectedDate+"T00:00:00") : null;
  const selSlots = selectedDate ? getSlots(selDate) : [];

  return (
    <div style={{ background:C.surface, borderRadius:C.r.xl, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:C.shadow }}>

      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={prevMonth} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:C.r.md, width:34, height:34, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
        <div style={{ fontWeight:700, fontSize:16 }}>{MONTHS[month]} {year}</div>
        <button onClick={nextMonth} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:C.r.md, width:34, height:34, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"10px 16px 4px" }}>
        {DAYS.map(d=>(
          <div key={d} style={{ textAlign:"center", fontSize:12, fontWeight:700, color:C.muted, paddingBottom:8 }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, padding:"0 16px 16px" }}>
        {cells.map((d,i) => {
          if (!d) return <div key={`e${i}`}/>;
          const date    = new Date(year, month, d);
          date.setHours(0,0,0,0);
          const isPast  = date < today;
          const dow     = date.getDay();
          const hasAvail= availDays.has(dow) && !isPast;
          const slots   = hasAvail ? getSlots(date) : [];
          const hasSlots= slots.length > 0;
          const dateStr = `${year}-${pad(month+1)}-${pad(d)}`;
          const isSel   = selectedDate === dateStr;
          const isToday = date.getTime()===today.getTime();

          return (
            <button key={d} onClick={hasSlots?()=>onSelectSlot(dateStr,null):undefined}
              disabled={!hasSlots}
              style={{
                aspectRatio:"1", borderRadius:C.r.md, border:"none",
                fontWeight: isToday||isSel ? 700 : 400,
                fontSize:14, cursor:hasSlots?"pointer":"default",
                background: isSel ? C.brand : isToday ? C.brandLight : "transparent",
                color: isSel ? "#fff" : isPast||!hasSlots ? "#D0CCC8" : C.text,
                position:"relative",
              }}>
              {d}
              {hasSlots && !isSel && (
                <span style={{ position:"absolute", bottom:4, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:C.brand, display:"block" }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots for selected day */}
      {selectedDate && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:"16px 20px" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.muted }}>
            {selDate?.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
          </div>
          {selSlots.length===0 ? (
            <div style={{ fontSize:13, color:C.muted }}>No available slots for this day.</div>
          ) : (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {selSlots.map(slot=>(
                <button key={slot} onClick={()=>onSelectSlot(selectedDate, slot)}
                  style={{
                    padding:"8px 16px", borderRadius:C.r.md, fontSize:14, fontWeight:600, cursor:"pointer",
                    border:`1.5px solid ${selectedTime===slot?C.brand:C.border}`,
                    background:selectedTime===slot?C.brand:"transparent",
                    color:selectedTime===slot?"#fff":C.text,
                    transition:"all .15s",
                  }}>
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Service card ───────────────────────────────────────
function ServiceCard({ service, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:"100%", textAlign:"left", border:"none", cursor:"pointer",
      borderRadius:C.r.lg, overflow:"hidden",
      outline: selected ? `2.5px solid ${C.brand}` : `1.5px solid ${C.border}`,
      background:selected ? C.brandLight : C.surface,
      transition:"outline .15s, background .15s",
    }}>
      {service.image_url && (
        <div style={{ height:140, overflow:"hidden" }}>
          <img src={service.image_url} alt={service.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>
      )}
      <div style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{service.name}</div>
          <div style={{ fontWeight:800, fontSize:14, color:C.brand, flexShrink:0 }}>{fmt(service.price)}</div>
        </div>
        {service.duration_min && (
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            ⏱ {service.duration_min < 60 ? `${service.duration_min} min` : `${Math.floor(service.duration_min/60)}h${service.duration_min%60>0?` ${service.duration_min%60}min`:""}`}
          </div>
        )}
        {service.description && <div style={{ fontSize:12, color:C.muted, marginTop:4, lineHeight:1.5 }}>{service.description}</div>}
        {selected && <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:C.brand }}>✓ Selected</div>}
      </div>
    </button>
  );
}

// ── Image upload ───────────────────────────────────────
function ImageUpload({ value, onChange, label, hint }) {
  const ref = useRef();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("booking-attachments").upload(path, file, { cacheControl:"3600" });
    setUploading(false);
    if (error) { alert("Upload failed"); setPreview(null); return; }
    const { data:{ publicUrl } } = supabase.storage.from("booking-attachments").getPublicUrl(path);
    onChange(publicUrl);
  }

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:C.muted, marginBottom:6 }}>{label}</div>
      {hint && <div style={{ fontSize:12, color:C.muted, marginBottom:8, lineHeight:1.5 }}>{hint}</div>}
      <div onClick={()=>ref.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
        style={{ border:`2px dashed ${preview?C.brand:C.border}`, borderRadius:C.r.lg, padding:preview?"0":"24px 16px", textAlign:"center", cursor:"pointer", background:preview?"transparent":C.bg, overflow:"hidden" }}>
        {uploading ? (
          <div style={{ padding:24, display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}><Spinner/><span style={{ fontSize:14, color:C.muted }}>Uploading…</span></div>
        ) : preview ? (
          <div style={{ position:"relative" }}>
            <img src={preview} alt="preview" style={{ width:"100%", maxHeight:200, objectFit:"cover" }}/>
            <button onClick={e=>{e.stopPropagation();setPreview(null);onChange(null);}} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", color:"#fff", border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:15 }}>×</button>
          </div>
        ) : (
          <div><div style={{ fontSize:24, marginBottom:6 }}>📎</div><div style={{ fontSize:13, fontWeight:600, color:C.text }}>Drop image or tap to upload</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>JPG, PNG up to 10MB</div></div>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
      </div>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────
function Steps({ current, hasServices }) {
  const steps = hasServices
    ? ["Service", "Date & time", "Your details"]
    : ["Date & time", "Your details"];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:24 }}>
      {steps.map((s,i) => {
        const idx = i + (hasServices ? 1 : 2); // map to step number
        const active = current === idx || (!hasServices && current === idx+1);
        const done   = current > idx || (!hasServices && current > idx+1);
        return (
          <div key={s} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background: done?C.green:active?C.brand:C.border, color: done||active?"#fff":C.muted, flexShrink:0 }}>
                {done ? "✓" : i+1}
              </div>
              <div style={{ fontSize:11, fontWeight:600, color:active?C.brand:C.muted, whiteSpace:"nowrap" }}>{s}</div>
            </div>
            {i<steps.length-1 && <div style={{ flex:1, height:1, background:C.border, margin:"0 8px", marginBottom:20 }}/>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────
export default function PublicBookingPage() {
  const { slug } = useParams();
  const [profile,      setProfile]      = useState(null);
  const [services,     setServices]     = useState([]);
  const [availability, setAvailability] = useState([]);
  const [blocked,      setBlocked]      = useState([]);
  const [status,       setStatus]       = useState("loading");

  // Step 1: service (if any), Step 2: date+time, Step 3: contact details
  const [step,         setStep]         = useState(1);
  const [selSvc,       setSelSvc]       = useState(null);
  const [custom,       setCustom]       = useState(false);
  const [selDate,      setSelDate]      = useState(null);
  const [selTime,      setSelTime]      = useState(null);
  const [form,         setForm]         = useState({ customer_name:"", customer_email:"", customer_phone:"", client_instructions:"", quoted_price:"" });
  const [clientImage,  setClientImage]  = useState(null);
  const [sending,      setSending]      = useState(false);
  const [done,         setDone]         = useState(false);

  const fld = k => e => setForm(p=>({...p,[k]:e.target.value}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: prof, error } = await supabase
        .from("public_profiles")
        .select("id, name, trade, bio, hourly_rate, booking_slug, extra_fields")
        .eq("booking_slug", slug).single();
      if (cancelled) return;
      if (error || !prof) { setStatus("notfound"); return; }
      setProfile(prof);

      const [{ data: svcs }, { data: avail }, { data: blk }] = await Promise.all([
        supabase.from("services").select("*").eq("profile_id", prof.id).eq("active", true).order("sort_order"),
        supabase.from("availability").select("*").eq("profile_id", prof.id),
        supabase.from("blocked_slots").select("*").eq("profile_id", prof.id),
      ]);
      if (!cancelled) {
        setServices(svcs ?? []);
        setAvailability(avail ?? []);
        setBlocked(blk ?? []);
        // If no services, skip to step 2
        setStep(svcs?.length > 0 ? 1 : 2);
        setStatus("found");
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  function handleSlotSelect(date, time) {
    setSelDate(date);
    setSelTime(time);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email) return;
    if (!selDate || !selTime) { alert("Please select a date and time"); return; }
    setSending(true);

    const selectedService = services.find(s=>s.id===selSvc);
    const payload = {
      profile_id:          profile.id,
      customer_name:       form.customer_name,
      customer_email:      form.customer_email,
      customer_phone:      form.customer_phone || null,
      preferred_date:      selDate,
      notes:               `${selTime} — ${form.client_instructions||""}`.trim(),
      service_id:          selSvc || null,
      client_image_url:    clientImage || null,
      client_instructions: form.client_instructions || null,
      quoted_price:        custom && form.quoted_price ? parseFloat(form.quoted_price) : selectedService?.price ?? null,
      status:              "pending",
    };

    const { error } = await supabase.from("booking_requests").insert(payload);
    setSending(false);
    if (error) { alert("Something went wrong — please try again"); return; }
    setDone(true);
  }

  // ── Loading / not found ──────────────────────────────
  if (status==="loading") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg }}><Spinner/></div>
  );
  if (status==="notfound") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, padding:20 }}>
      <div style={{ textAlign:"center" }}><div style={{ fontSize:48, marginBottom:16 }}>🔍</div><h2>Page not found</h2></div>
    </div>
  );

  const vertical      = getVerticalForProfession(profile.trade);
  const verticalColor = getVerticalColor(profile.trade);
  const terms         = getTerms(profile.trade);
  const hasServices   = services.length > 0;
  const selectedService = services.find(s=>s.id===selSvc);

  // ── Success ──────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:420, width:"100%", background:C.surface, borderRadius:C.r.xl, padding:"48px 40px", boxShadow:C.shadow, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:16 }}></div>
        <h2 style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>Request sent!</h2>
        <p style={{ fontSize:15, color:C.muted, lineHeight:1.7, marginBottom:16 }}>
          <strong>{profile.name}</strong> will confirm your {selDate && selTime ? `${selTime} slot on ${new Date(selDate+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}` : "request"} shortly.
        </p>
        {selectedService && (
          <div style={{ background:C.brandLight, borderRadius:C.r.md, padding:"12px 16px", marginBottom:16, fontSize:14 }}>
            <strong>{selectedService.name}</strong> — {fmt(selectedService.price)}
          </div>
        )}
        <div style={{ fontSize:13, color:C.muted }}>Confirmation sent to <strong>{form.customer_email}</strong></div>
      </div>
    </div>
  );

  // ── Main page ────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter',sans-serif", WebkitFontSmoothing:"antialiased" }}>
      {/* Nav */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:720, margin:"0 auto", height:56, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <a href="/" style={{ fontSize:15, fontWeight:900, color:C.brand, textDecoration:"none" }}>⚡ Vimen</a>
          <span style={{ fontSize:13, color:C.muted }}>{profile.name}</span>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"28px 20px 80px" }}>

        {/* Profile header */}
        <div style={{ background:C.surface, borderRadius:C.r.xl, border:`1px solid ${C.border}`, padding:"22px 26px", marginBottom:20, boxShadow:C.shadow, display:"flex", gap:16, alignItems:"center" }}>
          <Avatar name={profile.name} size={56}/>
          <div>
            <h1 style={{ fontSize:20, fontWeight:900, letterSpacing:-0.5, margin:0 }}>{profile.name}</h1>
            <div style={{ marginTop:6, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ background:verticalColor.bg, color:verticalColor.text, borderRadius:100, padding:"3px 12px", fontSize:13, fontWeight:700 }}>{vertical.icon} {profile.trade}</span>
              {profile.bio && <span style={{ fontSize:13, color:C.muted }}>{profile.bio}</span>}
            </div>
          </div>
        </div>

        {/* Steps */}
        <Steps current={step} hasServices={hasServices}/>

        {/* ── STEP 1: SERVICE ── */}
        {step===1 && hasServices && (
          <div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>Choose a service</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Select what you'd like to book, or choose "Something else".</div>
            <div style={{ display:"grid", gridTemplateColumns:services.some(s=>s.image_url)?"repeat(2,1fr)":"1fr", gap:12, marginBottom:12 }}>
              {services.map(s=>(
                <ServiceCard key={s.id} service={s} selected={selSvc===s.id} onClick={()=>{ setSelSvc(s.id); setCustom(false); }}/>
              ))}
            </div>
            <button type="button" onClick={()=>{ setCustom(true); setSelSvc(null); }}
              style={{ width:"100%", padding:"14px 18px", textAlign:"left", cursor:"pointer", borderRadius:C.r.lg, border:`1.5px dashed ${custom?C.brand:C.border}`, background:custom?C.brandLight:"transparent", fontFamily:"inherit", display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <span style={{ fontSize:20 }}></span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:custom?C.brand:C.text }}>Something else</div>
                <div style={{ fontSize:12, color:C.muted }}>Describe a custom request</div>
              </div>
              {custom && <span style={{ marginLeft:"auto", color:C.brand, fontWeight:700 }}>✓</span>}
            </button>
            <button onClick={()=>setStep(2)} disabled={!selSvc&&!custom}
              style={{ width:"100%", padding:"14px", borderRadius:C.r.lg, border:"none", background:C.brand, color:"#fff", fontWeight:800, fontSize:15, cursor:!selSvc&&!custom?"not-allowed":"pointer", opacity:!selSvc&&!custom?0.5:1, fontFamily:"inherit" }}>
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: DATE + TIME ── */}
        {step===2 && (
          <div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>Pick a date & time</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>
              {selectedService ? `Slots shown for ${selectedService.duration_min} minute sessions.` : "Choose your preferred slot."}
            </div>
            {availability.length===0 ? (
              <div style={{ background:C.surface, borderRadius:C.r.xl, border:`1px solid ${C.border}`, padding:"32px 24px", textAlign:"center", color:C.muted, fontSize:14 }}>
                This professional hasn't set their availability yet.<br/>Please contact them directly to arrange a time.
              </div>
            ) : (
              <Calendar
                availability={availability}
                blockedSlots={blocked}
                selectedService={selectedService}
                onSelectSlot={handleSlotSelect}
                selectedDate={selDate}
                selectedTime={selTime}/>
            )}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              {hasServices && <button onClick={()=>setStep(1)} style={{ flex:1, padding:"13px", borderRadius:C.r.lg, border:`1px solid ${C.border}`, background:C.surface, fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>}
              <button onClick={()=>setStep(3)} disabled={!selDate||!selTime}
                style={{ flex:2, padding:"13px", borderRadius:C.r.lg, border:"none", background:C.brand, color:"#fff", fontWeight:800, fontSize:15, cursor:!selDate||!selTime?"not-allowed":"pointer", opacity:!selDate||!selTime?0.5:1, fontFamily:"inherit" }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONTACT DETAILS ── */}
        {step===3 && (
          <form onSubmit={handleSubmit}>
            {/* Booking summary */}
            <div style={{ background:C.brandLight, borderRadius:C.r.lg, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <div>
                {selectedService && <div style={{ fontSize:14, fontWeight:700, color:C.brand }}>{selectedService.name} — {fmt(selectedService.price)}</div>}
                {selDate && selTime && <div style={{ fontSize:13, color:C.muted }}>{new Date(selDate+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})} at {selTime}</div>}
              </div>
              <button type="button" onClick={()=>setStep(2)} style={{ fontSize:12, color:C.brand, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Change</button>
            </div>

            {/* Custom request fields */}
            {(custom||!hasServices) && (
              <div style={{ background:C.surface, borderRadius:C.r.xl, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Your custom request</div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Budget (£) <span style={{ fontWeight:400 }}>— optional</span></label>
                  <input style={inp} type="number" min="0" step="0.01" value={form.quoted_price} onChange={fld("quoted_price")} placeholder="e.g. 150"/>
                </div>
                <ImageUpload value={clientImage} onChange={setClientImage} label="Reference image — optional" hint="Upload a photo or inspiration image."/>
              </div>
            )}

            {/* Client image for selected service */}
            {selSvc && !custom && (
              <div style={{ background:C.surface, borderRadius:C.r.xl, border:`1px solid ${C.border}`, padding:"18px 22px", marginBottom:16 }}>
                <ImageUpload value={clientImage} onChange={setClientImage} label="Reference image — optional" hint="A photo or example of what you'd like."/>
              </div>
            )}

            {/* Contact form */}
            <div style={{ background:C.surface, borderRadius:C.r.xl, border:`1px solid ${C.border}`, padding:"20px 24px", boxShadow:C.shadow }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Your details</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Name *</label>
                  <input style={inp} value={form.customer_name} onChange={fld("customer_name")} placeholder="Sarah Mitchell" required autoFocus/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Email *</label>
                  <input type="email" style={inp} value={form.customer_email} onChange={fld("customer_email")} required/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Phone <span style={{ fontWeight:400 }}>— optional</span></label>
                  <input style={inp} value={form.customer_phone} onChange={fld("customer_phone")}/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>
                    {vertical.id==="beauty"?"Any specific requests?":vertical.id==="professional"?"What's this regarding?":"Additional notes"} <span style={{ fontWeight:400 }}>— optional</span>
                  </label>
                  <textarea style={{...inp,height:80,resize:"vertical"}} value={form.client_instructions} onChange={fld("client_instructions")}
                    placeholder={vertical.id==="beauty"?"e.g. Please avoid bleach…":vertical.id==="professional"?"Briefly describe what you'd like to discuss…":"Any details or requirements…"}/>
                </div>
              </div>

              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button type="button" onClick={()=>setStep(2)} style={{ flex:1, padding:"13px", borderRadius:C.r.lg, border:`1px solid ${C.border}`, background:C.surface, fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
                <button type="submit" disabled={sending}
                  style={{ flex:2, padding:"13px", borderRadius:C.r.lg, border:"none", background:C.brand, color:"#fff", fontWeight:800, fontSize:15, cursor:sending?"not-allowed":"pointer", opacity:sending?0.7:1, fontFamily:"inherit" }}>
                  {sending?"Sending…":"Send booking request →"}
                </button>
              </div>
              <div style={{ textAlign:"center", fontSize:12, color:C.muted, marginTop:10 }}>
                {vertical.id==="beauty"?"No payment needed · Confirmed by message":vertical.id==="professional"?"No payment needed · Confidential":"No payment needed · Free quote"}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}