// src/pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { T } from "../styles/tokens";
import { useTranslation } from "../i18n/index.js";
import { copyToClipboard } from "../lib/clipboard";
import { 
  PageShell, MetricCard, Card, Badge, Btn, 
  SectionTitle, ErrorBox, Skeleton 
} from "../components/UI";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { formatCurrency } from "../lib/currency.js";

const fmtDate = d => { 
  try { 
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); 
  } catch { 
    return ""; 
  }
};

export default function DashboardPage({ profile, setPage, state, dispatch, toast }) {
  const { t } = useTranslation();
  const fmt = n => formatCurrency(n, profile?.currency);
  
  const [jobs, setJobs] = useState(state?.jobs || []);
  const [invoices, setInvoices] = useState(state?.invoices || []);
  const [clients, setClients] = useState(state?.clients || []);
  const [bookings, setBookings] = useState(state?.bookings || []);
  
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (state) { 
      setJobs(state.jobs || []); 
      setInvoices(state.invoices || []); 
      setClients(state.clients || []); 
      setBookings(state.bookings || []); 
      return; 
    }
    
    if (!profile?.id) return;
    
    setLoading(true);
    setError(null);

    import("../lib/db").then(async ({ getJobs, getInvoices, getClients, getBookingRequests }) => {
      try {
        const [j, i, c, b] = await Promise.all([
          getJobs(profile.id),
          getInvoices(profile.id),
          getClients(profile.id),
          getBookingRequests(profile.id)
        ]);

        if (j.error || i.error || c.error || b.error) {
          throw new Error("Failed to fetch dashboard data from server.");
        }

        setJobs(j.data ?? []); 
        setInvoices(i.data ?? []); 
        setClients(c.data ?? []); 
        setBookings(b.data ?? []);
      } catch (err) {
        setError({
          what: t("dashboard.loadErrorWhat", "Failed to load dashboard data"),
          why: err.message,
          nextAction: t("dashboard.loadErrorNext", "Please check your connection and refresh.")
        });
      } finally {
        setLoading(false);
      }
    });
  }, [state, profile?.id, t]);

  const paid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const unpaid = invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + Number(i.amount), 0);
  const upcoming = jobs.filter(j => j.status === "scheduled").sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const completed = jobs.filter(j => j.status === "completed").sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const pending = bookings.filter(b => b.status === "pending");
  
  const getClient = id => clients.find(c => c.id === id);
  const getInvForJob = jobId => invoices.find(i => i.job_id === jobId || i.jobId === jobId);

  return (
    <PageShell 
      title={t("dashboard.greeting", { name: (profile?.name || "").split(" ")[0] || t("dashboard.thereFallback") })}
      action={<Btn size="sm" onClick={() => setPage("jobs")}>+ {t("dashboard.newJob")}</Btn>}
    >
      <ErrorBoundary>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Skeleton height={100} style={{ flex: 1 }} />
              <Skeleton height={100} style={{ flex: 1 }} />
              <Skeleton height={100} style={{ flex: 1 }} />
              <Skeleton height={100} style={{ flex: 1 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Skeleton height={300} />
              <Skeleton height={300} />
            </div>
          </div>
        )}

        {!loading && error && (
          <ErrorBox
            what={error.what}
            why={error.why}
            nextAction={error.nextAction}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <MetricCard label={t("dashboard.earnedThisMonth")} value={fmt(paid)} sub={t("dashboard.invoicesCount", { count: invoices.filter(i => i.status === "paid").length })} accent />
              <MetricCard label={t("dashboard.outstanding")} value={fmt(unpaid)} sub={t("dashboard.unpaidCount", { count: invoices.filter(i => i.status === "unpaid").length })} />
              <MetricCard label={t("dashboard.upcomingJobs")} value={upcoming.length} sub={t("dashboard.scheduled")} />
              <MetricCard label={t("dashboard.totalClients")} value={clients.length} sub={t("dashboard.inYourCrm")} />
            </div>

            {pending.length > 0 && (
              <div style={{
                background: T.brandLight, border: `1px solid ${T.brand}30`, borderRadius: T.r.lg,
                padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: T.brand }}> {t("dashboard.newBookingRequests", { count: pending.length, plural: pending.length === 1 ? "" : "s" })}</span>
                  <span style={{ fontSize: 13, color: T.muted, marginLeft: 10 }}>{pending.map(b => b.customer_name || b.name).join(", ")}</span>
                </div>
                <Btn size="sm" onClick={() => setPage("booking")}>{t("dashboard.review")} →</Btn>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card style={{ marginBottom: 0 }}>
                <SectionTitle action={<span style={{ fontSize: 12, color: T.brand, cursor: "pointer", fontWeight: 600 }} onClick={() => setPage("jobs")}>{t("dashboard.viewAll")} →</span>}>
                  {t("dashboard.upcomingJobsTitle")}
                </SectionTitle>
                {upcoming.length === 0
                  ? <div style={{ textAlign: "center", padding: "24px 0", color: T.muted, fontSize: 14 }}>{t("dashboard.noUpcomingJobs")} <span style={{ color: T.brand, cursor: "pointer" }} onClick={() => setPage("jobs")}>{t("dashboard.addOne")}</span></div>
                  : upcoming.slice(0, 4).map(j => {
                    const cl = getClient(j.client_id || j.clientId); 
                    const d = j.date ? new Date(j.date) : null;
                    return (
                      <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
                        {d && (
                          <div style={{ width: 44, height: 44, borderRadius: T.r.md, background: T.brandLight, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: T.brand, lineHeight: 1 }}>{d.getDate()}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: T.brand }}>{d.toLocaleString("en-GB", { month: "short" }).toUpperCase()}</span>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</div>
                          <div style={{ fontSize: 12, color: T.muted }}>{cl?.name || j.client?.name || ""} · {j.time}</div>
                        </div>
                        {Number(j.amount) > 0 && <strong style={{ fontSize: 14, flexShrink: 0 }}>{fmt(j.amount)}</strong>}
                      </div>
                    );
                  })
                }
              </Card>

              <Card style={{ marginBottom: 0 }}>
                <SectionTitle action={<span style={{ fontSize: 12, color: T.brand, cursor: "pointer", fontWeight: 600 }} onClick={() => setPage("invoices")}>{t("dashboard.invoicesLink")} →</span>}>
                  {t("dashboard.recentActivity")}
                </SectionTitle>
                {completed.length === 0
                  ? <div style={{ textAlign: "center", padding: "24px 0", color: T.muted, fontSize: 14 }}>{t("dashboard.noCompletedJobs")}</div>
                  : completed.slice(0, 4).map(j => {
                    const cl = getClient(j.client_id || j.clientId); 
                    const inv = getInvForJob(j.id);
                    return (
                      <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.greenBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>✓</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</div>
                          <div style={{ fontSize: 12, color: T.muted }}>{cl?.name || j.client?.name || ""} · {fmtDate(j.date)}</div>
                        </div>
                        <Badge color={inv?.status === "paid" ? "green" : "amber"}>{inv?.status ?? t("dashboard.noInvoice")}</Badge>
                      </div>
                    );
                  })
                }
              </Card>
            </div>

            <div style={{
              marginTop: 16, background: T.white, borderRadius: T.r.lg, padding: "18px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: T.shadow.sm
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#020202", fontSize: 15 }}>{t("dashboard.bookingPageLive")}</div>
                <div style={{ fontSize: 13, color: "rgba(0, 0, 0, 0.45)", marginTop: 3 }}>
                  Vimen.app/b/{profile?.booking_slug || profile?.bookingSlug}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" size="sm" style={{ color: "#000000", borderColor: "rgba(0, 0, 0, 0.2)" }}
                  onClick={async () => {
                    const ok = await copyToClipboard(`https://Vimen.app/b/${profile?.booking_slug || profile?.bookingSlug}`);
                    if (toast) toast(ok ? t("dashboard.linkCopied") : t("dashboard.copyFailedManual"), ok ? "success" : "error");
                  }}>
                  {t("dashboard.copyLink")}
                </Btn>
                <Btn variant="white" size="sm" onClick={() => setPage("booking")}>{t("dashboard.viewPage")} →</Btn>
              </div>
            </div>
          </>
        )}
      </ErrorBoundary>
    </PageShell>
  );
}