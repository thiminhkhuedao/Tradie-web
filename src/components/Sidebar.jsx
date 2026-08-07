// src/components/Sidebar.jsx — Complete sidebar with all nav items
import { T } from "../styles/tokens";
import { getVerticalForProfession, getTerms } from "../lib/professions.js";
import { useTranslation } from "../i18n/index.js";

const initials = n => (n||"?").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2);

export default function Sidebar({ page, setPage, profile, onSignOut, pendingBookings=0, pendingQuotes=0 }) {
  const { t } = useTranslation();
  const terms = getTerms(profile?.trade);

  const NAV_SECTIONS = [
    {
      label: t("nav.core"),
      items: [
        { id:"dashboard",      label:t("nav.dashboard") },
        { id:"jobs",           label:terms.bookingPlural },
        { id:"quotes",         label:t("nav.quotes") },
        { id:"clients",        label:t("nav.clients") },
        { id:"invoices",       label:t("nav.invoices") },
        { id:"booking",        label:t("nav.booking")},
      ]
    },
    {
      label: t("nav.revenue"),
      items: [
        { id:"payments",       label:t("nav.payments") },
        { id:"marketplace",    label:t("nav.marketplace")},
      ]
    },
    {
      label: t("nav.growthSection"),
      items: [
        { id:"reviews",        label:t("nav.reviews") },
        { id:"referrals",      label:t("nav.referrals")},
        { id:"certifications", label:t("nav.certifications")},
      ]
    },
    {
      label: t("nav.account"),
      items: [
        { id:"settings",       label:t("nav.settings")},
      ]
    },
  ];

  const BADGES = { booking:pendingBookings, quotes:pendingQuotes };

  return (
    <nav style={{
      width:220, background:T.surface, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", flexShrink:0,
      position:"sticky", top:0, height:"100vh", zIndex:50,
      overflowY:"auto",
    }}>
      {/* Logo */}
      <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ fontSize:20, fontWeight:900, color:T.brand, letterSpacing:-0.5 }}> Tradie</div>
        <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
          {profile?.trade
            ? `${getVerticalForProfession(profile.trade).icon} ${profile.trade}`
            : t("nav.tagline")}
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex:1, padding:"8px 8px", overflowY:"auto" }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom:4 }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.hint, textTransform:"uppercase", letterSpacing:"0.8px", padding:"8px 12px 4px" }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = page === item.id;
              const badge  = BADGES[item.id];
              return (
                <button key={item.id} onClick={() => setPage(item.id)} style={{
                  display:"flex", alignItems:"center", gap:9,
                  width:"100%", padding:"8px 12px", borderRadius:T.r.md,
                  cursor:"pointer", marginBottom:1, border:"none",
                  textAlign:"left",
                  background: active ? T.brandLight : "transparent",
                  color:      active ? T.brand : T.muted,
                  fontSize:13, fontWeight: active ? 700 : 400,
                  transition:"all 0.12s",
                }}>
                  <span style={{ fontSize:14, flexShrink:0, opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {badge > 0 && (
                    <span style={{ background:T.brand, color:"#fff", borderRadius:T.r.full, fontSize:10, fontWeight:800, padding:"1px 6px" }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User area */}
      <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:T.brand, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>
            {initials(profile?.name)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile?.name || "…"}</div>
          </div>
        </div>
        <button type="button" onClick={onSignOut} style={{ width:"100%", padding:"6px", borderRadius:T.r.md, background:T.surface2, color:T.muted, border:"none", cursor:"pointer", fontSize:12, fontWeight:500 }}>
          {t("common.signOut")}
        </button>
      </div>
    </nav>
  );
}
