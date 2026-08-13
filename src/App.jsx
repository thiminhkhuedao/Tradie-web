// src/App.jsx — Complete app with ALL pages wired
import { useState, useEffect, useReducer, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import Sidebar          from "./components/Sidebar";
import { ToastStack }   from "./components/UI";
import {  useSignIn,  useSignUp,  useAuth, useClerk } from "@clerk/clerk-react";
import { setClerkTokenGetter } from "./lib/supabase";

// Marketing / logged-out
import HomePage         from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";

// Core pages
import DashboardPage    from "./pages/DashboardPage";
import JobsPage         from "./pages/JobsPage";
import ClientsPage      from "./pages/ClientsPage";
import InvoicesPage     from "./pages/InvoicesPage";
import BookingPage      from "./pages/BookingPage";
import SettingsPage     from "./pages/SettingsPage";
import MarketplacePage  from "./pages/MarketplacePage";

// Feature pages
import QuotesPage       from "./pages/QuotesPage";
import ReviewsPage      from "./pages/ReviewsPage";
import CertificationsPage from "./pages/CertificationsPage";
import ReferralsPage    from "./pages/ReferralsPage";
import PaymentsPage     from "./pages/PaymentsPage";

import { SEED, reducer, AppCtx } from "./lib/state.jsx";
import { useAppData } from "./hooks/useAppData.js";
import { VERTICALS, getVerticalForProfession } from "./lib/professions.js";
import "./styles/globals.css";

/* ── Toast hook ─────────────────────────────────────── */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((text, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(m => m.id !== id)), 3200);
  }, []);
  return { toasts, addToast };
}

/* ── Auth page ──────────────────────────────────────── */
import { T } from "./styles/tokens";

const CATEGORIES = [
  { id:"trades",    icon:"🔧", label:"Trades & Construction", examples:"Electrician, plumber, builder…",    vertical:"trades" },
  { id:"beauty",    icon:"💅", label:"Beauty & Wellness",      examples:"Hairdresser, nail tech, spa…",     vertical:"beauty" },
  { id:"food",      icon:"🍞", label:"Food & Hospitality",     examples:"Baker, chef, caterer…",            vertical:"other" },
  { id:"health",    icon:"🏥", label:"Health & Care",          examples:"Physio, nurse, psychologist…",     vertical:"professional" },
  { id:"legal",     icon:"⚖️", label:"Legal & Finance",        examples:"Lawyer, accountant, notary…",     vertical:"professional" },
  { id:"education", icon:"📚", label:"Education & Coaching",   examples:"Tutor, coach, trainer…",           vertical:"professional" },
  { id:"creative",  icon:"🎨", label:"Creative & Design",      examples:"Photographer, designer…",          vertical:"other" },
  { id:"tech",      icon:"💻", label:"Tech & IT",              examples:"Developer, IT consultant…",        vertical:"professional" },
  { id:"events",    icon:"🎉", label:"Events & Entertainment", examples:"DJ, decorator, planner…",          vertical:"other" },
  { id:"home",      icon:"🏡", label:"Home & Garden",          examples:"Cleaner, gardener, handyman…",     vertical:"trades" },
];

function getPasswordStrength(password) {
  if (!password) return { score:0, label:"", color:"" };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label:"Weak",   color:"#EF4444" };
  if (score <= 2) return { score, label:"Fair",   color:"#F59E0B" };
  if (score <= 3) return { score, label:"Good",   color:"#3B82F6" };
  return              { score, label:"Strong", color:"#10B981" };
}

const loginAttempts = { count:0, lockedUntil:null };
function checkRateLimit() {
  if (loginAttempts.lockedUntil && new Date() < loginAttempts.lockedUntil) {
    const mins = Math.ceil((loginAttempts.lockedUntil - new Date()) / 60000);
    return `Too many failed attempts. Try again in ${mins} minute${mins>1?"s":""}.`;
  }
  return null;
}
function recordFailedAttempt() {
  loginAttempts.count++;
  if (loginAttempts.count >= 5) { loginAttempts.lockedUntil = new Date(Date.now() + 5*60*1000); loginAttempts.count = 0; }
}
function resetAttempts() { loginAttempts.count = 0; loginAttempts.lockedUntil = null; }

function AuthPage({ onAuth, initialMode = "login" }) {
  const [mode,     setMode]     = useState(initialMode);
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState("form");
  const [code,     setCode]     = useState("");
  const [error,    setError]    = useState("");

  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const strength = getPasswordStrength(pass);
  const inp = { width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${T.borderMed}`, fontSize:15, background:T.surface, color:T.text, boxSizing:"border-box", fontFamily:"inherit", marginBottom:0 };

  async function submit(e) {
    e.preventDefault();
    setError("");
    const rateLimitMsg = checkRateLimit();
    if (rateLimitMsg) { setError(rateLimitMsg); return; }
    if (mode==="signup" && strength.score < 2) { setError("Password is too weak — use at least 8 characters with a mix of letters and numbers."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const [firstName, ...rest] = name.trim().split(" ");
        await signUp.create({ emailAddress:email, password:pass, username, firstName:firstName||undefined, lastName:rest.join(" ")||undefined });
        await signUp.prepareEmailAddressVerification({ strategy:"email_code" });
        setStep("verify"); setLoading(false); return;
      } else {
        const result = await signIn.create({ identifier:email, password:pass });
        if (result.status === "complete") { resetAttempts(); await setActiveSignIn({ session:result.createdSessionId }); }
      }
    } catch (err) {
      recordFailedAttempt();
      const remaining = 5 - loginAttempts.count;
      const msg = err.errors?.[0]?.longMessage || err.message || "Something went wrong";
      setError(loginAttempts.count > 0 && mode==="login" ? `${msg} (${remaining} attempt${remaining!==1?"s":""} remaining before lockout)` : msg);
    }
    setLoading(false);
  }

  async function verifyCode(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") { await setActiveSignUp({ session:result.createdSessionId }); window.location.reload(); }
      else if (result.status === "missing_requirements") { setError(`Almost there — still missing: ${result.missingFields?.join(", ")||"some required fields"}.`); }
      else { setError(`Unexpected status: ${result.status}. Please try again.`); }
    } catch (err) { setError(err?.errors?.[0]?.longMessage || err?.message || "Invalid code"); }
    setLoading(false);
  }

  if (step === "verify") return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:420, maxWidth:"100%", background:T.surface, borderRadius:T.r.xl, padding:"52px 48px", boxShadow:T.shadow.xl }}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:16 }}>📬</div>
        <h3 style={{ fontSize:22, fontWeight:800, marginBottom:8, letterSpacing:-0.5, textAlign:"center" }}>Check your email</h3>
        <p style={{ fontSize:14, color:T.muted, marginBottom:28, textAlign:"center", lineHeight:1.6 }}>
          We sent a 6-digit code to <strong>{email}</strong>.
        </p>
        <form onSubmit={verifyCode} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <input style={{ ...inp, fontSize:28, fontWeight:800, letterSpacing:8, textAlign:"center" }}
            value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
            placeholder="000000" maxLength={6} autoFocus inputMode="numeric"/>
          {error && <div style={{ fontSize:13, color:"#EF4444", background:"#FEF2F2", padding:"10px 14px", borderRadius:8 }}>{error}</div>}
          <button type="submit" disabled={loading||code.length!==6}
            style={{ padding:"14px", borderRadius:8, background:T.brand, color:"#fff", border:"none", fontWeight:700, fontSize:15, cursor:loading||code.length!==6?"not-allowed":"pointer", opacity:loading||code.length!==6?0.6:1 }}>
            {loading ? "Verifying…" : "Verify email →"}
          </button>
          <button type="button" onClick={()=>{ setStep("form"); setError(""); }}
            style={{ background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>
            ← Back to sign up
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ display:"flex", width:900, maxWidth:"100%", borderRadius:T.r.xl, overflow:"hidden", boxShadow:T.shadow.xl }}>
        {/* Left brand panel */}
        <div style={{ flex:1, background:"#0F0E0D", padding:"52px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:T.brand, marginBottom:48, letterSpacing:-0.5 }}>⚡ Vimen</div>
            <h2 style={{ fontSize:34, fontWeight:900, color:"#fff", letterSpacing:-1.5, lineHeight:1.15, marginBottom:16 }}>
              Booking and<br/>billing for<br/><span style={{ color:T.brand }}>every profession</span>
            </h2>
            <p style={{ fontSize:15, color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>
              Trades, beauty & wellness, or professional services — quotes, appointments, invoices and payments, all in one place.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["📅","Clients book their own appointments"],["🧾","Invoice and get paid"],["💳","Vimen Pay — 2% flat"],["⭐","Automatic review requests"],["🔒","Your data stays yours"]].map(([icon,text]) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:12, fontSize:14, color:"rgba(255,255,255,0.55)" }}>
                <span style={{ fontSize:18 }}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div style={{ width:440, background:T.surface, padding:"48px 44px", display:"flex", flexDirection:"column", justifyContent:"center", overflowY:"auto", maxHeight:"100vh" }}>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:-0.5 }}>
            {mode==="login" ? "Welcome back" : "Create account"}
          </h3>
          <p style={{ fontSize:14, color:T.muted, marginBottom:24 }}>
            {mode==="login" ? "Sign in to your Vimen account" : "Start for free — no card needed"}
          </p>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode==="signup" && <>
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Full name</label>
                <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Jake Morrison" autoFocus/>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Username</label>
                <input style={inp} value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,""))} placeholder="jakemorrison"/>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:8 }}>What do you do?</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {CATEGORIES.map(cat=>(
                    <button key={cat.id} type="button" onClick={()=>setCategory(cat)}
                      style={{ padding:"9px 11px", borderRadius:8, border:`1.5px solid ${category.id===cat.id?T.brand:T.border}`, background:category.id===cat.id?T.brandLight:"transparent", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:category.id===cat.id?T.brand:T.text }}>{cat.icon} {cat.label}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2, lineHeight:1.3 }}>{cat.examples}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>}

            <div>
              <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Email</label>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus={mode==="login"}/>
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>
                Password {mode==="signup" && <span style={{ fontWeight:400 }}>— min. 8 characters</span>}
              </label>
              <div style={{ position:"relative" }}>
                <input style={{ ...inp, paddingRight:44 }} type={showPass?"text":"password"}
                  value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/>
                <button type="button" onClick={()=>setShowPass(s=>!s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:16 }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
              {mode==="signup" && pass.length>0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i=>(
                      <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=strength.score?strength.color:T.border, transition:"background .2s" }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:strength.color, fontWeight:600 }}>{strength.label}</div>
                </div>
              )}
            </div>

            {error && <div style={{ fontSize:13, color:"#EF4444", background:"#FEF2F2", padding:"10px 14px", borderRadius:8, lineHeight:1.5 }}>{error}</div>}

            <button disabled={loading}
              style={{ padding:"12px", borderRadius:8, background:T.brand, color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:4 }}>
              {loading ? "Please wait…" : mode==="login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <div style={{ height:1, background:T.border, margin:"20px 0" }}/>
          <div style={{ textAlign:"center", fontSize:14, color:T.muted }}>
            {mode==="login" ? "No account? " : "Already signed up? "}
            <span style={{ color:T.brand, cursor:"pointer", fontWeight:700 }}
              onClick={()=>{ setMode(m=>m==="login"?"signup":"login"); setError(""); }}>
              {mode==="login" ? "Sign up free" : "Sign in"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main app shell ─────────────────────────────────── */
function AppShell() {
  const [page, setPage] = useState("dashboard");
  const { toasts, addToast } = useToasts();
  const { profile, data, setData, loading, refresh, saveProfile, setProfile } = useAppData();
  const { signOut } = useClerk();


  const state = {
    user:             profile ?? SEED.user,
    jobs:             data?.jobs             ?? [],
    clients:          data?.clients          ?? [],
    invoices:         data?.invoices         ?? [],
    quotes:           data?.quotes           ?? [],
    booking_requests: data?.booking_requests ?? [],
    transactions:     data?.transactions     ?? [],
    payouts:          data?.payouts          ?? [],
    reviews:          data?.reviews          ?? [],
    certifications:   data?.certifications   ?? [],
    referrals:        data?.referrals        ?? [],
    listings:         data?.listings         ?? [],
  };

  function dispatch(action) {
    const { type, payload } = action;
    if (type === "UPDATE_USER") {
      saveProfile(payload);
      return;
    }
    // Apply optimistic update immediately
    setData(prev => {
      if (!prev) return prev;
      switch (type) {
        case "ADD_JOB":
          return { ...prev, jobs: [...prev.jobs, payload] };
        case "ADD_QUOTE":
          return { ...prev, quotes: [payload, ...prev.quotes] };
        case "UPDATE_QUOTE":
          return { ...prev, quotes: prev.quotes.map(q => q.id===payload.id ? {...q,...payload} : q) };
        case "DELETE_QUOTE":
          return { ...prev, quotes: prev.quotes.filter(q => q.id!==payload) };
        case "ADD_CERT":
          return { ...prev, certifications: [...prev.certifications, payload] };
        case "UPDATE_CERT":
          return { ...prev, certifications: prev.certifications.map(c => c.id===payload.id ? {...c,...payload} : c) };
        case "DELETE_CERT":
          return { ...prev, certifications: prev.certifications.filter(c => c.id!==payload) };
        case "ADD_REVIEW":
          return { ...prev, reviews: [payload, ...prev.reviews] };
        case "ADD_REFERRAL":
          return { ...prev, referrals: [payload, ...prev.referrals] };
        default:
          return prev;
      }
    });
    // Resync with Supabase in background to confirm the real state
    refresh();
  }

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:T.bg }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚡</div>
          <div style={{ fontSize:15, color:T.muted }}>Loading your workspace…</div>
        </div>
      </div>
    );
  }

  const pageProps = { profile:state.user, setPage, state, dispatch, toast:addToast, refresh, setProfile };

  const PAGES = {
    dashboard:      <DashboardPage      {...pageProps}/>,
    jobs:           <JobsPage           {...pageProps}/>,
    clients:        <ClientsPage        {...pageProps}/>,
    invoices:       <InvoicesPage       {...pageProps}/>,
    booking:        <BookingPage        {...pageProps}/>,
    marketplace:    <MarketplacePage    {...pageProps}/>,
    payments:       <PaymentsPage       {...pageProps}/>,
    quotes:         <QuotesPage         {...pageProps}/>,
    reviews:        <ReviewsPage        {...pageProps}/>,
    certifications: <CertificationsPage {...pageProps}/>,
    referrals:      <ReferralsPage      {...pageProps}/>,
    settings:       <SettingsPage       {...pageProps}/>,
  };

  return (
    <AppCtx.Provider value={{ state, dispatch, toast:addToast, refresh }}>
      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar
          page={page} setPage={setPage}
          profile={state.user}
          onSignOut={() => signOut()}
          pendingBookings={state.booking_requests?.filter(b=>b.status==="pending").length ?? 0}
          pendingQuotes={state.quotes?.filter(q=>q.status==="sent").length ?? 0}
        />
        <div style={{ flex:1, overflow:"auto", minWidth:0, background:T.bg }}>
          {PAGES[page] || PAGES.dashboard}
        </div>
      </div>
      <ToastStack messages={toasts}/>
    </AppCtx.Provider>
  );
}

/* ── Demo mode shell (no Clerk key configured) ─────── */
function DemoAppShell() {
  const [page, setPage] = useState("dashboard");
  const { toasts, addToast } = useToasts();
  const [demoState, demoDispatch] = useReducer(reducer, SEED);

  const pageProps = {
    profile: demoState.user, setPage, state: demoState, dispatch: demoDispatch,
    toast: addToast, refresh: () => {}, setProfile: () => {},
  };

  const PAGES = {
    dashboard:      <DashboardPage      {...pageProps}/>,
    jobs:           <JobsPage           {...pageProps}/>,
    clients:        <ClientsPage        {...pageProps}/>,
    invoices:       <InvoicesPage       {...pageProps}/>,
    booking:        <BookingPage        {...pageProps}/>,
    marketplace:    <MarketplacePage    {...pageProps}/>,
    payments:       <PaymentsPage       {...pageProps}/>,
    quotes:         <QuotesPage         {...pageProps}/>,
    reviews:        <ReviewsPage        {...pageProps}/>,
    certifications: <CertificationsPage {...pageProps}/>,
    referrals:      <ReferralsPage      {...pageProps}/>,
    settings:       <SettingsPage       {...pageProps}/>,
  };

  return (
    <AppCtx.Provider value={{ state: demoState, dispatch: demoDispatch, toast: addToast, refresh: () => {} }}>
      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar
          page={page} setPage={setPage}
          profile={demoState.user}
          onSignOut={() => window.location.reload()}
          pendingBookings={demoState.booking_requests?.filter(b=>b.status==="pending").length ?? 0}
          pendingQuotes={demoState.quotes?.filter(q=>q.status==="sent").length ?? 0}
        />
        <div style={{ flex:1, overflow:"auto", minWidth:0, background:T.bg }}>
          {PAGES[page] || PAGES.dashboard}
        </div>
      </div>
      <ToastStack messages={toasts}/>
    </AppCtx.Provider>
  );
}

/* ── Clerk-gated app (real auth) ────────────────────── */
function ClerkGatedApp() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  const [searchParams] = useSearchParams();

  const wantsSignup   = searchParams.get("signup") === "1";
  const hasAuthIntent = searchParams.has("signup") || searchParams.has("login");
  const initialMode   = wantsSignup ? "signup" : "login";

  if (!isLoaded) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading…</div>;

  // Render unauthenticated pages (HomePage or PricingPage)
  if (!isSignedIn && !hasAuthIntent) {
    if (window.location.pathname === "/pricing") {
      return (
        <PricingPage
          onSignIn={() => navigate("/?login=1", { replace: false })}
          onSignUp={() => navigate("/?signup=1", { replace: false })}
        />
      );
    }

    return (
      <HomePage
        onSignIn={() => navigate("/?login=1", { replace: false })}
        onSignUp={() => navigate("/?signup=1", { replace: false })}
      />
    );
  }

  if (!isSignedIn)
    return <AuthPage initialMode={initialMode}/>;

  return <AppShell />;
}

/* ── Root ───────────────────────────────────────────── */
export default function App({ useClerk: hasClerkKey = false }) {
  if (!hasClerkKey) {
    return <DemoAppShell />;
  }
  return <ClerkGatedApp />;
}