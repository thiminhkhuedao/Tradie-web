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

const VERTICAL_DEFAULTS = {
  trades:       "Electrician",
  beauty:       "Hairdresser",
  professional: "Lawyer",
};

function AuthPage({ onAuth, initialMode = "login", initialProfession = "Electrician" }) {
  const [mode,   setMode]   = useState(initialMode);
  const [email,  setEmail]  = useState("");
  const [pass,   setPass]   = useState("");
  const [name,   setName]   = useState("");
  const [username, setUsername] = useState("");
  const [profession, setProfession] = useState(initialProfession);
  const [loading,setLoading]= useState(false);
  const [step, setStep] = useState("form");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const vertical = getVerticalForProfession(profession);
  const inp = { width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${T.borderMed}`, fontSize:15, background:T.surface, color:T.text, boxSizing:"border-box", fontFamily:"inherit", marginBottom:0 };

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const trimmedName = name.trim();
        const [firstName, ...rest] = trimmedName.split(" ");
        const lastName = rest.join(" ");

        await signUp.create({
          emailAddress: email,
          password: pass,
          username: username,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        });

        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setStep("verify");
        setLoading(false);
        return;
      } else {
        const result = await signIn.create({
          identifier: email,
          password: pass,
        });

        if (result.status === "complete") {
          await setActiveSignIn({
            session: result.createdSessionId,
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.errors?.[0]?.longMessage || err.message);
    }

    setLoading(false);
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      console.log("verify result:", result.status, result.missingFields, result.unverifiedFields);

      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        window.location.reload();
      } else if (result.status === "missing_requirements") {
        setError(
          `Almost there — still missing: ${
            result.missingFields?.join(", ") || "some required fields"
          }. Please check your details and try again, or contact support.`
        );
      } else {
        setError(`Unexpected status: ${result.status}. Please try again or contact support.`);
      }
    } catch (err) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "Invalid code");
    }
    setLoading(false);
  }

  // Verification step
  if (step === "verify") {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ width:420, maxWidth:"100%", background:T.surface, borderRadius:T.r.xl, padding:"52px 48px", boxShadow:T.shadow.xl }}>
          <div style={{ fontSize:32, textAlign:"center", marginBottom:16 }}>📬</div>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:8, letterSpacing:-0.5, textAlign:"center" }}>Check your email</h3>
          <p style={{ fontSize:14, color:T.muted, marginBottom:28, textAlign:"center", lineHeight:1.6 }}>
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
          </p>
          <form onSubmit={verifyCode} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Verification code</label>
              <input
                style={{ ...inp, fontSize:28, fontWeight:800, letterSpacing:8, textAlign:"center" }}
                value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="000000" maxLength={6} autoFocus inputMode="numeric"/>
            </div>
            {error && <div style={{ fontSize:13, color:"#EF4444", background:"#FEF2F2", padding:"10px 14px", borderRadius:8 }}>{error}</div>}
            <button type="submit" disabled={loading || code.length!==6}
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
  }


  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ display:"flex", width:860, maxWidth:"100%", borderRadius:T.r.xl, overflow:"hidden", boxShadow:T.shadow.xl }}>
        {/* Left brand panel */}
        <div style={{ flex:1, background:"#0F0E0D", padding:"52px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:T.brand, marginBottom:48, letterSpacing:-0.5 }}>⚡ Tradie</div>
            <h2 style={{ fontSize:34, fontWeight:900, color:"#fff", letterSpacing:-1.5, lineHeight:1.15, marginBottom:16 }}>
              Booking and<br/>billing for<br/><span style={{ color:T.brand }}>every profession</span>
            </h2>
            <p style={{ fontSize:15, color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>
              Trades, beauty & wellness, or professional services — quotes, appointments, invoices and payments, all in one place.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["📅",`${vertical.terms.bookingPlural} clients book themselves`],["🧾","Invoice and get paid"],["💳","Tradie Pay"],[vertical.icon, `Built for ${vertical.label.toLowerCase()}`],["⭐","Automatic review requests"]].map(([icon,text]) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:12, fontSize:14, color:"rgba(255,255,255,0.55)" }}>
                <span style={{ fontSize:18 }}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
        {/* Right form */}
        <div style={{ width:420, background:T.surface, padding:"52px 48px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:-0.5 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h3>
          <p style={{ fontSize:14, color:T.muted, marginBottom:28 }}>
            {mode === "login" ? "Sign in to your Tradie account" : "Start for free — no card needed"}
          </p>
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode === "signup" && (
              <>
                <div><label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Full name</label>
                  <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Jake Morrison" autoFocus/></div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Username</label>
                  <input style={inp} value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,""))} placeholder="jakemorrison"/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Your profession</label>
                  <select style={inp} value={profession} onChange={e=>setProfession(e.target.value)}>
                    {Object.values(VERTICALS).filter(v=>v.id!=="other").map(v => (
                      <optgroup key={v.id} label={`${v.icon}  ${v.label}`}>
                        {v.professions.map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  <div style={{ fontSize:12, color:T.muted, marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ background:vertical.color.bg, color:vertical.color.text, borderRadius:999, padding:"2px 8px", fontWeight:600 }}>
                      {vertical.icon} {vertical.label}
                    </span>
                  </div>
                </div>
              </>
            )}
            <div><label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Email</label>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus={mode==="login"}/></div>
            <div><label style={{ fontSize:13, fontWeight:500, color:T.muted, display:"block", marginBottom:6 }}>Password</label>
              <input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></div>
            {error && <div style={{ fontSize:13, color:"#EF4444", background:"#FEF2F2", padding:"10px 14px", borderRadius:8 }}>{error}</div>}
            <button disabled={loading} style={{ padding:"12px", borderRadius:8, background:T.brand, color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:4 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
            </button>
          </form>
          <div style={{ height:1, background:T.border, margin:"20px 0" }}/>
          <div style={{ textAlign:"center", fontSize:14, color:T.muted }}>
            {mode === "login" ? "No account? " : "Already signed up? "}
            <span style={{ color:T.brand, cursor:"pointer", fontWeight:700 }} onClick={() => { setMode(m => m==="login"?"signup":"login"); setError(""); }}>
              {mode === "login" ? "Sign up free" : "Sign in"}
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

  const verticalSlug = searchParams.get("vertical");
  const wantsSignup = searchParams.get("signup") === "1";
  const hasAuthIntent = searchParams.has("signup") || searchParams.has("login");

  const initialProfession =
    VERTICAL_DEFAULTS[verticalSlug] ?? "Electrician";

  const initialMode =
    wantsSignup ? "signup" : "login";

  if (!isLoaded)
    return <div>Loading...</div>;

  if (!isSignedIn && !hasAuthIntent) {

    return (
      <HomePage
        onSignIn={() => navigate("/?login=1", { replace: false })}
        onSignUp={() => navigate("/?signup=1", { replace: false })}
      />
    );
  }

  if (!isSignedIn)
    return (
      <AuthPage
        initialMode={initialMode}
        initialProfession={initialProfession}
      />
    );

  return <AppShell />;
}

/* ── Root ───────────────────────────────────────────── */
// `useClerk` here is the boolean flag main.jsx passes based on whether
// VITE_CLERK_PUBLISHABLE_KEY is set — NOT the Clerk hook of the same
// name (that one is only ever called inside ClerkGatedApp, which is
// only rendered once we know a <ClerkProvider> is actually mounted).
export default function App({ useClerk: hasClerkKey = false }) {
  if (!hasClerkKey) {
    return <DemoAppShell />;
  }
  return <ClerkGatedApp />;
}