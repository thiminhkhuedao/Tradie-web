// src/pages/HomePage.jsx

import { T } from "../styles/tokens";
import { useTranslation } from "../i18n/index.js";

const S = {
  page: { minHeight:"100vh", background:T.surface, color:T.text, fontFamily:"'Inter',sans-serif", WebkitFontSmoothing:"antialiased" },
  wrap: { maxWidth:1160, margin:"0 auto", padding:"0 28px" },
};

function Bolt() { return <span style={{ color:T.brand }}>⚡</span>; }

function LangSwitch({ lang, setLanguage, languages }) {
  return (
    <div style={{ display:"flex", gap:2, background:T.surface2, borderRadius:999, padding:2 }}>
      {languages.map(l => (
        <button key={l.code} onClick={() => setLanguage(l.code)}
          style={{
            border:"none", cursor:"pointer", padding:"5px 10px", borderRadius:999, fontSize:12, fontWeight:700,
            background: lang===l.code ? T.surface : "transparent",
            color: lang===l.code ? T.text : T.hint,
            boxShadow: lang===l.code ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}>
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function NavBar({ onSignIn, onSignUp, t, lang, setLanguage, languages }) {
  return (
    <nav style={{ position:"sticky", top:0, zIndex:50, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}` }}>
      <div style={{ ...S.wrap, display:"flex", alignItems:"center", justifyContent:"space-between", height:68 }}>
        <div style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:19, letterSpacing:-0.5, display:"flex", alignItems:"center", gap:8 }}>
          <Bolt/>Vimen
        </div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <LangSwitch lang={lang} setLanguage={setLanguage} languages={languages}/>
          <button onClick={onSignIn} style={{ background:"none", border:"none", color:T.muted, fontSize:14, fontWeight:600, cursor:"pointer", padding:"8px 4px" }}>
            {t("home.nav.signIn")}
          </button>
          <button onClick={onSignUp} style={{ background:T.brand, color:"#fff", border:"none", padding:"10px 22px", borderRadius:4, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            {t("home.nav.startFree")} →
          </button>
        </div>
      </div>
    </nav>
  );
}

function VerticalCard({ icon, title, desc, professions, artifact, color, href, ctaLabel }) {
  return (
    <a href={href} style={{ display:"flex", flexDirection:"column", borderRadius:20, overflow:"hidden", border:`1px solid ${T.border}`, textDecoration:"none", color:T.text, transition:"transform .2s, border-color .2s, box-shadow .2s", cursor:"pointer" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.borderColor=T.borderMed; e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ padding:"32px 28px 24px", background:T.surface2 }}>
        <div style={{ fontSize:28, marginBottom:16 }}>{icon}</div>
        <h3 style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:21, letterSpacing:-0.5, marginBottom:10 }}>{title}</h3>
        <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, marginBottom:18 }}>{desc}</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:4 }}>
          {professions.map(p => (
            <span key={p} style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:100, background:`${color}1A`, color }}>{p}</span>
          ))}
        </div>
      </div>
      <div style={{ flex:1, borderTop:`1px solid ${T.border}`, padding:"20px 24px", display:"flex", flexDirection:"column", gap:10 }}>
        {artifact}
      </div>
      <div style={{ margin:"0 20px 20px", padding:12, borderRadius:8, background:color, textAlign:"center", fontWeight:700, fontSize:14, color:"#fff" }}>
        {ctaLabel} →
      </div>
    </a>
  );
}

function ArtifactRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
      <span style={{ color:T.hint }}>{label}</span>
      <span style={{ fontWeight:600 }}>{value}</span>
    </div>
  );
}

function ArtifactTotal({ label, value, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:`1px solid ${T.border}`, marginTop:4 }}>
      <span style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:T.hint }}>{label}</span>
      <span style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:22, color }}>{value}</span>
    </div>
  );
}

function ApptChip({ time, initials, name, price, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:T.surface2, borderRadius:10 }}>
      <span style={{ fontSize:12, fontWeight:700, color:T.hint, width:40 }}>{time}</span>
      <div style={{ width:26, height:26, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>{initials}</div>
      <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{name}</span>
      <span style={{ fontSize:13, fontWeight:700, color:"#D94F88" }}>{price}</span>
    </div>
  );
}

function DossierRow({ label, value, highlight }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
      <span style={{ color:T.hint }}>{label}</span>
      <span style={{ fontWeight:600, color:highlight||T.text }}>{value}</span>
    </div>
  );
}

export default function HomePage({ onSignIn, onSignUp }) {
  const { t, lang, setLanguage, languages } = useTranslation();

  const STATS = [
    ["2%", t("home.hero.stats.fee")],
    ["3", t("home.hero.stats.verticals")],
    ["<5 min", t("home.hero.stats.setup")],
    ["€0", t("home.hero.stats.free")],
  ];

  const STEPS = [
    [t("home.howItWorks.step1.num"), t("home.howItWorks.step1.title"), t("home.howItWorks.step1.desc")],
    [t("home.howItWorks.step2.num"), t("home.howItWorks.step2.title"), t("home.howItWorks.step2.desc")],
    [t("home.howItWorks.step3.num"), t("home.howItWorks.step3.title"), t("home.howItWorks.step3.desc")],
  ];

  const PLANS = [
    { name: t("home.pricing.plans.free.name"), price: "€0", sub: t("home.pricing.plans.free.sub"), hi: false },
    { name: t("home.pricing.plans.pro.name"),  price: "€29", sub: t("home.pricing.plans.pro.sub"),  hi: true },
    { name: t("home.pricing.plans.team.name"), price: "€79", sub: t("home.pricing.plans.team.sub"), hi: false },
  ];

  const FOOTER_LINKS = [
    [t("home.footer.trades"), "/?vertical=trades&signup=1"],
    [t("home.footer.beauty"), "/?vertical=beauty&signup=1"],
    [t("home.footer.professional"), "/?vertical=professional&signup=1"],
    [t("home.footer.contact"), "mailto:hello@Vimen.app"],
  ];

  return (
    <div style={S.page}>
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} t={t} lang={lang} setLanguage={setLanguage} languages={languages}/>

      {/* HERO */}
      <header style={{ padding:"100px 0 80px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:1, backgroundImage:"linear-gradient(rgba(0,0,0,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.035) 1px,transparent 1px)", backgroundSize:"72px 72px" }}/>
        <div style={{ ...S.wrap, position:"relative", zIndex:2 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:12, fontWeight:700, color:T.brand, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:28, border:"1px solid rgba(232,80,10,.3)", padding:"6px 16px", borderRadius:100 }}>
            ⚡ {t("home.hero.badge")}
          </div>
          <h1 style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:"clamp(40px,6.5vw,80px)", lineHeight:.96, letterSpacing:-2, marginBottom:28 }}>
            {t("home.hero.titleLine1")}<br/>{t("home.hero.titleLine2")} <span style={{ color:T.brand }}>{t("home.hero.titleHighlight")}</span>
          </h1>
          <p style={{ fontSize:19, color:T.muted, maxWidth:560, margin:"0 auto 44px", lineHeight:1.65 }}>
            {t("home.hero.sub")}
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:72 }}>
            <button onClick={onSignUp} style={{ background:T.brand, color:"#fff", border:"none", padding:"16px 32px", borderRadius:4, fontWeight:800, fontSize:15, cursor:"pointer" }}>
              {t("home.hero.ctaPrimary")} →
            </button>
            <a href="#verticals" style={{ border:`1.5px solid ${T.borderMed}`, color:T.text, padding:"16px 32px", borderRadius:4, fontWeight:700, fontSize:15, textDecoration:"none" }}>
              {t("home.hero.ctaSecondary")}
            </a>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:56, padding:"32px 0", borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap" }}>
            {STATS.map(([n,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:30, letterSpacing:-0.5 }}>{n}</div>
                <div style={{ fontSize:12, color:T.hint, textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* VERTICALS */}
      <section id="verticals" style={{ padding:"100px 0" }}>
        <div style={S.wrap}>
          <div style={{ fontSize:12, fontWeight:700, color:T.hint, letterSpacing:"1.5px", textTransform:"uppercase", textAlign:"center", marginBottom:14 }}>{t("home.verticals.eyebrow")}</div>
          <h2 style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:"clamp(28px,4vw,44px)", letterSpacing:-1, textAlign:"center", marginBottom:16 }}>{t("home.verticals.title")}</h2>
          <p style={{ fontSize:17, color:T.muted, textAlign:"center", maxWidth:520, margin:"0 auto 56px", lineHeight:1.7 }}>
            {t("home.verticals.sub")}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            <VerticalCard
              icon="🔧" title={t("home.verticals.trades.title")} color={T.brand}
              href="/?vertical=trades&signup=1"  ctaLabel={t("home.verticals.trades.cta")}
              desc={t("home.verticals.trades.desc")}
              professions={t("home.verticals.trades.professions")}
              artifact={<>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:T.hint, textTransform:"uppercase", marginBottom:6 }}>{t("home.verticals.trades.artifact.tag")}</div>
                <ArtifactRow label={t("home.verticals.trades.artifact.line1Label")} value="€180"/>
                <ArtifactRow label={t("home.verticals.trades.artifact.line2Label")} value="€320"/>
                <ArtifactRow label={t("home.verticals.trades.artifact.line3Label")} value="€520"/>
                <ArtifactTotal label={t("home.verticals.trades.artifact.totalLabel")} value="€1,020" color="#C2410C"/>
              </>}
            />
            <VerticalCard
              icon="💅" title={t("home.verticals.beauty.title")} color="#D94F88"
              href="/?vertical=beauty&signup=1" ctaLabel={t("home.verticals.beauty.cta")}
              desc={t("home.verticals.beauty.desc")}
              professions={t("home.verticals.beauty.professions")}
              artifact={<>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:T.hint, textTransform:"uppercase", marginBottom:6 }}>{t("home.verticals.beauty.artifact.tag")}</div>
                <ApptChip time="9:00" initials="EM" name="Emma R." price="€145" color="#D94F88"/>
                <ApptChip time="10:30" initials="SL" name="Sophie L." price="€38" color="#C97B9E"/>
                <ApptChip time="11:15" initials="TC" name="Tara C." price="€55" color="#E89BB8"/>
                <ArtifactTotal label={t("home.verticals.beauty.artifact.totalLabel")} value="€238" color="#BE185D"/>
              </>}
            />
            <VerticalCard
              icon="⚖️" title={t("home.verticals.professional.title")} color="#1D4ED8"
              href="/?vertical=professional&signup=1" ctaLabel={t("home.verticals.professional.cta")}
              desc={t("home.verticals.professional.desc")}
              professions={t("home.verticals.professional.professions")}
              artifact={<>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:T.hint, textTransform:"uppercase", marginBottom:6 }}>{t("home.verticals.professional.artifact.tag")}</div>
                <DossierRow label={t("home.verticals.professional.artifact.typeLabel")} value={t("home.verticals.professional.artifact.typeValue")}/>
                <DossierRow label={t("home.verticals.professional.artifact.scheduledLabel")} value="Tue 24 June, 14:00"/>
                <DossierRow label={t("home.verticals.professional.artifact.durationLabel")} value={t("home.verticals.professional.artifact.durationValue")}/>
                <DossierRow label={t("home.verticals.professional.artifact.statusLabel")} value={t("home.verticals.professional.artifact.statusValue")} highlight="#1D4ED8"/>
                <ArtifactTotal label={t("home.verticals.professional.artifact.totalLabel")} value="€350" color="#1D4ED8"/>
              </>}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"100px 0", borderTop:`1px solid ${T.border}` }}>
        <div style={S.wrap}>
          <div style={{ fontSize:12, fontWeight:700, color:T.hint, letterSpacing:"1.5px", textTransform:"uppercase", textAlign:"center", marginBottom:14 }}>{t("home.howItWorks.eyebrow")}</div>
          <h2 style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:"clamp(28px,4vw,44px)", letterSpacing:-1, textAlign:"center", marginBottom:16 }}>{t("home.howItWorks.title")}</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:T.border, marginTop:56, border:`1px solid ${T.border}` }}>
            {STEPS.map(([num,title,desc]) => (
              <div key={num} style={{ background:T.surface, padding:"36px 32px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.brand, letterSpacing:1, marginBottom:18 }}>{num}</div>
                <h3 style={{ fontSize:19, fontWeight:800, marginBottom:10, letterSpacing:-0.3 }}>{title}</h3>
                <p style={{ fontSize:14.5, color:T.muted, lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding:"80px 0", borderTop:`1px solid ${T.border}` }}>
        <div style={S.wrap}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:32, flexWrap:"wrap" }}>
            <div>
              <h2 style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:"clamp(26px,3.5vw,40px)", letterSpacing:-1, marginBottom:10 }}>{t("home.pricing.titleLine1")}<br/>{t("home.pricing.titleLine2")}</h2>
              <p style={{ fontSize:16, color:T.muted, maxWidth:440, lineHeight:1.7, marginBottom:28 }}>
                {t("home.pricing.sub")}
              </p>
              <button onClick={onSignUp} style={{ background:T.brand, color:"#fff", border:"none", padding:"16px 32px", borderRadius:4, fontWeight:800, fontSize:15, cursor:"pointer" }}>
                {t("home.pricing.cta")} →
              </button>
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {PLANS.map(p => (
                <div key={p.name} style={{ background:T.surface2, border:`1px solid ${p.hi?T.brand:T.border}`, borderRadius:14, padding:"24px 28px", minWidth:160 }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:T.hint, marginBottom:12 }}>{p.name}</div>
                  <div style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:32, letterSpacing:-1, marginBottom:4 }}>{p.price}<span style={{ fontFamily:"Inter", fontSize:14, fontWeight:500, color:T.hint }}>{t("home.pricing.perMonth")}</span></div>
                  <div style={{ fontSize:12, color:p.hi?T.brand:T.hint }}>{p.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:"100px 0", textAlign:"center", borderTop:`1px solid ${T.border}` }}>
        <div style={S.wrap}>
          <h2 style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:"clamp(32px,5.5vw,60px)", letterSpacing:-2, marginBottom:20, lineHeight:.96 }}>
            {t("home.finalCta.titleLine1")}<br/>{t("home.finalCta.titleLine2")} <span style={{ color:T.brand }}>{t("home.finalCta.titleHighlight")}</span>
          </h2>
          <p style={{ fontSize:18, color:T.muted, marginBottom:38, maxWidth:440, margin:"0 auto 38px", lineHeight:1.65 }}>
            {t("home.finalCta.sub")}
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/?vertical=trades&signup=1" style={{ background:T.brand, color:"#fff", padding:"16px 28px", borderRadius:4, fontWeight:700, fontSize:14, textDecoration:"none" }}>🔧 {t("home.finalCta.tradesLink")}</a>
            <a href="/?vertical=beauty&signup=1" style={{ background:"#D94F88", color:"#fff", padding:"16px 28px", borderRadius:4, fontWeight:700, fontSize:14, textDecoration:"none" }}>💅 {t("home.finalCta.beautyLink")}</a>
            <a href="/?vertical=professional&signup=1" style={{ background:"#1D4ED8", color:"#fff", padding:"16px 28px", borderRadius:4, fontWeight:700, fontSize:14, textDecoration:"none" }}>⚖️ {t("home.finalCta.professionalLink")}</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${T.border}`, padding:"48px 0" }}>
        <div style={{ ...S.wrap, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
          <div style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:17, display:"flex", alignItems:"center", gap:8 }}><Bolt/>Vimen</div>
          <div style={{ display:"flex", gap:24 }}>
            {FOOTER_LINKS.map(([label,href]) => (
              <a key={label} href={href} style={{ fontSize:13, color:T.hint, fontWeight:600, textDecoration:"none" }}>{label}</a>
            ))}
          </div>
          <p style={{ color:T.hint, fontSize:13 }}>{t("home.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
