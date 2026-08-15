// src/pages/PaymentsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../i18n/index.js";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import {
 PageShell, Card, Btn, Badge, Table, TD,
 MetricCard, SectionTitle, Divider, Empty,
} from "../components/UI";
import { formatCurrency } from "../lib/currency.js";

/* ── helpers ─────────────────────────────────────────── */

const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return ""; }};
const fmtTime = d => { try { return new Date(d).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); } catch { return ""; }};
const pct = (a,b) => b>0 ? `${((a/b)*100).toFixed(1)}%` : "";

const STATUS_BADGE = {
 completed: "green",
 pending: "amber",
 processing: "blue",
 failed: "red",
 refunded: "gray",
 paid: "green",
 in_transit: "blue",
};

/* ══════════════════════════════════════════════════════
 MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function PaymentsPage({ profile, state, dispatch }) {
 const { t: tr } = useTranslation();
 const fmt = n => formatCurrency(n, profile?.currency);
 const [tab, setTab] = useState("overview");

 // Pull from local demo state (swapped for real Supabase calls when connected)
 const transactions = state?.payment_transactions ?? [];
 const payouts = state?.payouts ?? [];

 const completed = transactions.filter(t=>t.status==="completed");
 const pending = transactions.filter(t=>t.status==="pending");

 // Stats
 const totalVolume = completed.reduce((s,t)=>s+Number(t.gross_amount),0);
 const totalEarned = completed.reduce((s,t)=>s+Number(t.net_amount),0);
 const totalStripeFee = completed.reduce((s,t)=>s+Number(t.stripe_fee),0);
 const pendingVolume = pending.reduce((s,t)=>s+Number(t.gross_amount),0);

 const paidOut = payouts.filter(p=>p.status==="paid").reduce((s,p)=>s+Number(p.amount),0);
 const inTransit = payouts.filter(p=>p.status==="in_transit").reduce((s,p)=>s+Number(p.amount),0);
 const balance = totalEarned - paidOut;

 // This month
 const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
 const thisMonth = completed.filter(t=>t.paid_at && t.paid_at >= monthStart);
 const thisMonthVol = thisMonth.reduce((s,t)=>s+Number(t.gross_amount),0);

 const isConnected = Boolean(profile?.stripe_customer_id);

 const TabBtn = ({ id, label }) => (
 <button type="button" onClick={()=>setTab(id)} style={{
 padding:"8px 20px", border:"none",
 borderBottom: tab===id ? `2px solid ${T.brand}` : "2px solid transparent",
 background:"transparent",
 color: tab===id ? T.brand : T.muted,
 fontSize:14, fontWeight:tab===id?700:400, cursor:"pointer",
 }}>{label}</button>
 );

 return (
 <PageShell title={`${tr("payments.title")} `}>

 {/* Tab nav */}
 <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
 <TabBtn id="overview" label={tr("payments.tabs.overview")}/>
 <TabBtn id="transactions" label={tr("payments.tabs.transactions", { count: completed.length })}/>
 <TabBtn id="payouts" label={tr("payments.tabs.payouts")}/>
 <TabBtn id="connect" label={tr("payments.tabs.account")}/>
 </div>

 {/* ── OVERVIEW ─────────────────────────────────── */}
 {tab==="overview" && (
 <>
 {/* Connection status banner */}
 {!isConnected ? (
 <div style={{ background:T.amberBg, border:`1px solid ${T.amber}40`, borderRadius:T.r.lg,
 padding:"16px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
 <div>
 <div style={{ fontWeight:700, color:T.amber, marginBottom:4 }}>️ {tr("payments.overview.notConnectedTitle")}</div>
 <div style={{ fontSize:13, color:T.muted }}>{tr("payments.overview.notConnectedDesc")}</div>
 </div>
 <Btn onClick={()=>setTab("connect")}>{tr("payments.overview.connectStripeBtn")}</Btn>
 </div>
 ) : (
 <div style={{ background:T.greenBg, border:`1px solid ${T.green}30`, borderRadius:T.r.lg,
 padding:"14px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
 <div style={{ fontWeight:600, color:T.green }}>
 {tr("payments.overview.connectedBanner")}
 </div>
 <Badge color="green">{tr("payments.status.connected")}</Badge>
 </div>
 )}

 {/* Key metrics */}
 <div style={{ display:"flex", gap:12, marginBottom:12 }}>
 <MetricCard label={tr("payments.metrics.totalVolume")} value={fmt(totalVolume)}
 sub={tr("payments.metrics.paymentsCount", { count: completed.length })} icon="" accent/>
 <MetricCard label={tr("payments.metrics.yourEarnings")} value={fmt(totalEarned)}
 sub={tr("payments.metrics.ofGross", { pct: pct(totalEarned,totalVolume) })} icon=""/>
 <MetricCard label={tr("payments.metrics.thisMonth")} value={fmt(thisMonthVol)}
 sub={tr("payments.metrics.paymentsCount", { count: thisMonth.length })} icon=""/>
 </div>
 <div style={{ display:"flex", gap:12, marginBottom:24 }}>
 <MetricCard label={tr("payments.metrics.availableBalance")} value={fmt(balance)}
 sub={tr("payments.metrics.readyToPayOut")} icon=""/>
 <MetricCard label={tr("payments.metrics.inTransitToBank")} value={fmt(inTransit)}
 sub={tr("payments.metrics.arrivingSoon")} icon="⏳"/>
 <MetricCard label={tr("payments.metrics.totalPaidOut")} value={fmt(paidOut)}
 sub={tr("payments.metrics.payoutsCount", { count: payouts.filter(p=>p.status==="paid").length })} icon="↗"/>
 </div>

 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

 {/* Recent transactions */}
 <Card>
 <SectionTitle action={
 <span style={{ fontSize:12, color:T.brand, cursor:"pointer", fontWeight:600 }}
 onClick={()=>setTab("transactions")}>{tr("payments.overview.viewAll")}</span>
 }>{tr("payments.overview.recentPayments")}</SectionTitle>
 {completed.length===0
 ? <Empty icon="" message={tr("payments.overview.emptyPayments")}/>
 : completed.slice(0,5).map(t=>(
 <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
 padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
 <div>
 <div style={{ fontSize:14, fontWeight:600 }}>{t.client_name}</div>
 <div style={{ fontSize:12, color:T.muted }}>
 {t.description} · {fmtDate(t.paid_at)}
 </div>
 </div>
 <div style={{ textAlign:"right" }}>
 <div style={{ fontWeight:700, color:T.green }}>{fmt(t.net_amount)}</div>
 <div style={{ fontSize:11, color:T.muted }}>{tr("payments.overview.ofGrossAmount", { amount: fmt(t.gross_amount) })}</div>
 </div>
 </div>
 ))
 }
 </Card>

 </div>
 </>
 )}

 {/* ── TRANSACTIONS ─────────────────────────────── */}
 {tab==="transactions" && (
 <>
 {/* Summary strip */}
 <div style={{ display:"flex", gap:10, marginBottom:16 }}>
 <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`,
 borderRadius:T.r.md, padding:"12px 16px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", marginBottom:4 }}>{tr("payments.transactions.grossVolume")}</div>
 <div style={{ fontSize:20, fontWeight:800 }}>{fmt(totalVolume)}</div>
 </div>
 <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`,
 borderRadius:T.r.md, padding:"12px 16px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", marginBottom:4 }}>{tr("payments.transactions.stripeFeesPaid")}</div>
 <div style={{ fontSize:20, fontWeight:800, color:T.muted }}>{fmt(totalStripeFee)}</div>
 </div>
 <div style={{ flex:1, background:T.greenBg, border:`1px solid ${T.green}30`,
 borderRadius:T.r.md, padding:"12px 16px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:T.green, textTransform:"uppercase", marginBottom:4 }}>{tr("payments.transactions.netToYou")}</div>
 <div style={{ fontSize:20, fontWeight:800, color:T.green }}>{fmt(totalEarned)}</div>
 </div>
 </div>

 <Card style={{ padding:0, overflow:"hidden" }}>
 {transactions.length===0
 ? <Empty icon="" message={tr("payments.transactions.empty")}/>
 : (
 <Table headers={[
 tr("payments.table.date"), tr("payments.table.client"), tr("payments.table.description"),
 tr("payments.table.gross"), tr("payments.table.stripeFee"),
 tr("payments.table.youReceive"), tr("payments.table.status"),
 ]}>
 {transactions.map(t=>(
 <tr key={t.id}>
 <TD>
 <div style={{ fontWeight:500, fontSize:13 }}>{fmtDate(t.paid_at||t.created_at)}</div>
 <div style={{ fontSize:11, color:T.muted }}>{t.paid_at?fmtTime(t.paid_at):""}</div>
 </TD>
 <TD style={{ fontWeight:500 }}>{t.client_name||""}</TD>
 <TD style={{ color:T.muted, maxWidth:160 }}>
 <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
 {t.description||""}
 </div>
 </TD>
 <TD style={{ fontWeight:600 }}>{fmt(t.gross_amount)}</TD>
 <TD style={{ color:T.muted }}>−{fmt(t.stripe_fee)}</TD>
 <TD style={{ fontWeight:700, color:T.green }}>{fmt(t.net_amount)}</TD>
 <TD><Badge color={STATUS_BADGE[t.status]||"gray"}>{tr(`payments.status.${t.status}`)}</Badge></TD>
 </tr>
 ))}
 </Table>
 )
 }
 </Card>
 </>
 )}

 {/* ── PAYOUTS ──────────────────────────────────── */}
 {tab==="payouts" && (
 <>
 <div style={{ display:"flex", gap:12, marginBottom:20 }}>
 <MetricCard label={tr("payments.payoutsTab.availableForPayout")} value={fmt(balance)} sub={tr("payments.payoutsTab.estimated")} accent/>
 <MetricCard label={tr("payments.payoutsTab.inTransit")} value={fmt(inTransit)} sub={tr("payments.payoutsTab.expectedWithin2Days")}/>
 <MetricCard label={tr("payments.payoutsTab.totalPaidOut")} value={fmt(paidOut)} sub={tr("payments.metrics.payoutsCount", { count: payouts.filter(p=>p.status==="paid").length })}/>
 </div>

 {/* Payout schedule info */}
 <Card style={{ marginBottom:16, background:T.surface2, border:"none" }}>
 <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
 <div style={{ fontSize:28, flexShrink:0 }}></div>
 <div>
 <div style={{ fontWeight:700, marginBottom:4 }}>{tr("payments.payoutSchedule.title")}</div>
 <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>
 {tr("payments.payoutSchedule.description")}{" "}
 <strong>{payouts[0]?.bank_last4 ?? "****"}</strong>.
 </div>
 </div>
 </div>
 </Card>

 <Card style={{ padding:0, overflow:"hidden" }}>
 {payouts.length===0
 ? <Empty icon="" message={tr("payments.payoutsTab.empty")}/>
 : (
 <Table headers={[
 tr("payments.table.dateInitiated"), tr("payments.table.arrivalDate"), tr("payments.table.amount"),
 tr("payments.table.transactions"), tr("payments.table.bank"), tr("payments.table.status"),
 ]}>
 {payouts.map(p=>(
 <tr key={p.id}>
 <TD>{fmtDate(p.created_at)}</TD>
 <TD style={{ fontWeight:500 }}>
 {p.arrival_date ? fmtDate(p.arrival_date) : ""}
 </TD>
 <TD style={{ fontWeight:700 }}>{fmt(p.amount)}</TD>
 <TD style={{ color:T.muted }}>{p.transaction_count}</TD>
 <TD style={{ color:T.muted, fontFamily:"monospace" }}>
 ••••{p.bank_last4 ?? "****"}
 </TD>
 <TD><Badge color={STATUS_BADGE[p.status]||"gray"}>{tr(`payments.status.${p.status}`)}</Badge></TD>
 </tr>
 ))}
 </Table>
 )
 }
 </Card>
 </>
 )}

 {/* ── CONNECT / ACCOUNT ────────────────────────── */}
 {tab==="connect" && (
 <div style={{ maxWidth:560 }}>

 {/* Stripe Connect status */}
 <Card>
 <SectionTitle>{tr("payments.connect.stripeAccountTitle")}</SectionTitle>
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
 padding:"16px 0", borderBottom:`1px solid ${T.border}` }}>
 <div style={{ display:"flex", alignItems:"center", gap:12 }}>
 <div style={{ width:44, height:44, borderRadius:T.r.md,
 background:"#635BFF", display:"flex", alignItems:"center",
 justifyContent:"center", fontSize:22, flexShrink:0 }}></div>
 <div>
 <div style={{ fontWeight:700 }}>{tr("payments.connect.stripeConnect")}</div>
 <div style={{ fontSize:13, color:T.muted }}>
 {isConnected
 ? tr("payments.connect.connectedDesc")
 : tr("payments.connect.notConnectedDesc")}
 </div>
 </div>
 </div>
 <Badge color={isConnected?"green":"amber"}>{isConnected?tr("payments.status.active"):tr("payments.status.notConnected")}</Badge>
 </div>
 {isConnected ? (
 <div style={{ paddingTop:16 }}>
 <div style={{ fontSize:13, color:T.muted, marginBottom:14 }}>
 {tr("payments.connect.connectedBody")}
 </div>
 <Btn variant="ghost" size="sm"
 onClick={()=>window.open("https://dashboard.stripe.com","_blank")}>
 {tr("payments.connect.openDashboard")}
 </Btn>
 </div>
 ) : (
 <div style={{ paddingTop:16 }}>
 <div style={{ fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.6 }}>
 {tr("payments.connect.notConnectedBody")}
 </div>
 <Btn onClick={()=>toast.success(tr("payments.connect.redirectingToast"))}>
 {tr("payments.connect.connectAccountBtn")}
 </Btn>
 </div>
 )}
 </Card>

 {/* How it works */}
 <Card>
 <SectionTitle>{tr("payments.howItWorks.title")}</SectionTitle>
 {["1","2","3","4"].map(num=>(
 <div key={num} style={{ display:"flex", gap:14, padding:"12px 0",
 borderBottom:`1px solid ${T.border}` }}>
 <div style={{ width:28, height:28, borderRadius:"50%", background:T.brand,
 color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
 fontSize:13, fontWeight:800, flexShrink:0 }}>{num}</div>
 <div>
 <div style={{ fontWeight:600, marginBottom:4 }}>{tr(`payments.howItWorks.step${num}.title`)}</div>
 <div style={{ fontSize:13, color:T.muted }}>{tr(`payments.howItWorks.step${num}.desc`)}</div>
 </div>
 </div>
 ))}
 </Card>

 </div>
 )}
 </PageShell>
 );
}