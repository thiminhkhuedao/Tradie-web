// src/pages/InvoicesPage.jsx

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import {
  getInvoices, createInvoice, markInvoicePaid, deleteInvoice,
} from "../lib/db";
import { createPaymentLink } from "../lib/stripe";
import { sendInvoiceEmail, sendInvoicePaidSMS } from "../lib/notifications";
import { useTranslation } from "../i18n/index.js";
import {
  PageShell, Card, Btn, Badge, Table, TD,
  Modal, ConfirmModal, Field, FieldRow, FormActions,
  Tabs, Empty, MetricCard, Divider,
} from "../components/UI";

const fmt     = n => `€${Number(n||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return d||"—"; } };
const today   = () => new Date().toISOString().slice(0,10);

export default function InvoicesPage({ profile }) {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [modal,    setModal]    = useState(null); // null|"add"|invoice-id
  const [delId,    setDelId]    = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [form,     setForm]     = useState({});
  const fld = k => e => setForm(p=>({...p,[k]:e.target.value}));

  // ── Load data from Supabase ──
  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await getInvoices(profile.id);
    setInvoices(data ?? []);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  // Also load clients + jobs for the create-invoice form
  useEffect(() => {
    if (!profile?.id) return;
    import("../lib/db").then(async ({ getClients, getJobs }) => {
      const [{ data: c }, { data: j }] = await Promise.all([
        getClients(profile.id),
        getJobs(profile.id),
      ]);
      setClients(c ?? []);
      setJobs(j ?? []);
    });
  }, [profile?.id]);

  // ── Computed values ──
  const filtered  = (filter === "all" ? invoices : invoices.filter(i => i.status === filter))
                      .sort((a,b) => b.created_at?.localeCompare(a.created_at ?? "") ?? 0);
  const paid      = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+Number(i.amount),0);
  const outstanding = invoices.filter(i=>i.status==="unpaid").reduce((s,i)=>s+Number(i.amount),0);
  const isOverdue = inv => inv.status==="unpaid" && inv.due_date && new Date(inv.due_date) < new Date();
  const previewInv = modal && modal!=="add" ? invoices.find(i=>i.id===modal) : null;

  // ── Create invoice ──
  function openAdd() {
    const noInvoice = jobs.filter(j=>j.status==="completed" && !invoices.find(i=>i.job_id===j.id));
    const job = noInvoice[0];
    setForm({
      client_id: job?.client_id ?? clients[0]?.id ?? "",
      job_id:    job?.id ?? "",
      amount:    job?.amount ?? "",
      due_date:  "",
    });
    setModal("add");
  }

  async function saveInvoice(e) {
    e.preventDefault();
    if (!form.client_id || !form.amount) { toast.error(t("invoices.selectClientAndAmount")); return; }
    setBusy(true);
    const { data, error } = await createInvoice(profile.id, {
      client_id: form.client_id,
      job_id:    form.job_id || null,
      amount:    parseFloat(form.amount),
      due_date:  form.due_date || null,
      status:    "unpaid",
    });
    setBusy(false);
    if (error) { toast.error(t("invoices.createFailed")); return; }
    setInvoices(prev => [data, ...prev]);
    toast.success(t("invoices.createdToast"));
    setModal(null);
  }

  // ── Mark paid (+ optional SMS) ──
  async function handleMarkPaid(id) {
    const { data, error } = await markInvoicePaid(id);
    if (error) { toast.error(t("invoices.markPaidFailed")); return; }
    setInvoices(prev => prev.map(i => i.id===id ? data : i));
    toast.success(t("invoices.markedPaidToast"));

    // Send SMS notification if enabled
    if (profile?.notif_sms_paid && profile?.phone) {
      const inv = invoices.find(i=>i.id===id);
      if (inv) sendInvoicePaidSMS(inv, profile); // fire and forget
    }

    setModal(null);
  }

  // ── Send email via Resend ──
  async function handleSendEmail(inv) {
    console.log("SEND EMAIL CLICK", inv);

    if (!inv.client?.email) {
      toast.error(t("invoices.noClientEmail"));
      return;
    }

    setBusy(true);

    try {
      const result = await sendInvoiceEmail(inv, profile);
      console.log("EMAIL RESULT", result);

      if (result.success) {
        toast.success(t("invoices.emailedToast",{email:inv.client.email}));
      } else {
        toast.error(t("invoices.emailFailedToast",{error:result.error}));
      }
    } catch (e) {
      console.error("EMAIL ERROR", e);
      toast.error("Email failed");
    }

    setBusy(false);
  }

  // ── Create Stripe payment link ──
  async function handleStripeLink(inv) {
    console.log("STRIPE CLICK", inv);

    setBusy(true);

    try {
      const result = await createPaymentLink(inv, profile);
      console.log("STRIPE RESULT", result);

      if (!result) {
        toast.error(t("invoices.paymentLinkFailed"));
        return;
      }

      setInvoices(prev => prev.map(i =>
        i.id === inv.id
          ? { ...i, stripe_payment_link_url: result.url, stripe_payment_link_id: result.id }
          : i
      ));

      toast.success(t("invoices.paymentLinkCreated"));

    } catch(e) {
      console.error("STRIPE ERROR", e);
      toast.error("Stripe failed");
    }

    setBusy(false);
  }

  // ── Copy bank details ──
  async function handleCopyBankDetails(inv) {
    const lines = [
      profile.bank_name && `${t("invoices.bankLabel")} ${profile.bank_name}`,
      profile.sort_code && `${t("invoices.sortCodeLabel")} ${profile.sort_code}`,
      profile.account_number && `${t("invoices.accountLabel")} ${profile.account_number}`,
      `${t("invoices.referenceLabel")} ${inv.invoice_number}`,
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast.success(t("invoices.bankDetailsCopied"));
    } catch {
      toast.error(t("invoices.copyFailedManual"));
    }
  }

  // ── Delete ──
  async function handleDelete() {
    const { error } = await deleteInvoice(delId);
    if (error) { toast.error(t("invoices.deleteFailed")); return; }
    setInvoices(prev => prev.filter(i => i.id !== delId));
    setDelId(null);
    setModal(null);
    toast.success(t("invoices.deletedToast"));
  }

  const iStyle = {
    width:"100%", padding:"10px 12px", borderRadius:T.r.md,
    border:`1px solid ${T.borderMed}`, fontSize:14,
    background:T.surface, color:T.text,
    boxSizing:"border-box", fontFamily:"inherit",
  };

  return (
    <PageShell title={t("nav.invoices")} action={<Btn size="sm" onClick={openAdd}>+ {t("invoices.newInvoice")}</Btn>}>

      {/* ── Create invoice modal ── */}
      {modal === "add" && (
        <Modal title={t("invoices.createInvoiceTitle")} onClose={() => setModal(null)}>
          <form onSubmit={saveInvoice}>
            <Field label={t("invoices.clientLabel")}>
              <select style={iStyle} value={form.client_id}
                onChange={e => { fld("client_id")(e); setForm(p=>({...p,client_id:e.target.value,job_id:""})); }}>
                <option value="">{t("invoices.selectClient")}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label={t("invoices.linkedJobLabel")}>
              <select style={iStyle} value={form.job_id}
                onChange={e => {
                  const job = jobs.find(j=>j.id===e.target.value);
                  setForm(p=>({...p, job_id:e.target.value, amount:job?.amount?String(job.amount):p.amount}));
                }}>
                <option value="">{t("invoices.noneOption")}</option>
                {jobs.filter(j=>j.client_id===form.client_id||j.client?.id===form.client_id).map(j =>
                  <option key={j.id} value={j.id}>{j.title} · {fmtDate(j.date)}</option>
                )}
              </select>
            </Field>
            <FieldRow>
              <Field label={t("invoices.amountLabel")} flex="1">
                <input type="number" style={iStyle} value={form.amount}
                  onChange={fld("amount")} placeholder="0.00" min="0" step="0.01"/>
              </Field>
              <Field label={t("invoices.dueDateLabel")} flex="1">
                <input type="date" style={iStyle} value={form.due_date} onChange={fld("due_date")}/>
              </Field>
            </FieldRow>
            <FormActions onCancel={() => setModal(null)} submitLabel={t("invoices.newInvoice")} loading={busy}/>
          </form>
        </Modal>
      )}

      {/* ── Invoice preview modal ── */}
      {previewInv && (
        <Modal title={previewInv.invoice_number} onClose={() => setModal(null)} width={560}>
          {/* Action bar */}
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {previewInv.status==="unpaid" && <>
              <Btn size="sm" onClick={() => handleSendEmail(previewInv)} disabled={busy}>
                 {busy?t("invoices.sending"):t("invoices.sendEmail")}
              </Btn>
              {!previewInv.stripe_payment_link_url
                ? <Btn size="sm" variant="ghost" onClick={() => handleStripeLink(previewInv)} disabled={busy}>
                     {busy?t("invoices.creating"):t("invoices.createPaymentLink")}
                  </Btn>
                : <a href={previewInv.stripe_payment_link_url} target="_blank" rel="noopener noreferrer">
                    <Btn size="sm" variant="success"> {t("invoices.openPaymentLink")} ↗</Btn>
                  </a>
              }
              <Btn size="sm" variant="success" onClick={() => handleMarkPaid(previewInv.id)}>
                ✓ {t("invoices.markAsPaid")}
              </Btn>
              {(profile.bank_name || profile.account_number) && (
                <Btn size="sm" variant="ghost" onClick={() => handleCopyBankDetails(previewInv)}>
                   {t("invoices.copyBankDetails")}
                </Btn>
              )}
            </>}
            <Btn size="sm" variant="danger" style={{marginLeft:"auto"}} onClick={() => setDelId(previewInv.id)}>
              {t("common.delete")}
            </Btn>
          </div>

          {/* Invoice document */}
          <div style={{border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:28}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
              <div>
                <div style={{fontSize:26,fontWeight:900,color:T.brand,letterSpacing:-1.5}}>Vimen</div>
                <div style={{fontSize:13,color:T.muted}}>{profile.name} · {profile.trade}</div>
                <div style={{fontSize:12,color:T.muted}}>{profile.email}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:20,fontWeight:800}}>{previewInv.invoice_number}</div>
                <div style={{fontSize:12,color:T.muted}}>{t("invoices.issuedLabel")} {fmtDate(previewInv.created_at)}</div>
                {previewInv.due_date && <div style={{fontSize:12,color:T.muted}}>{t("invoices.dueLabel")} {fmtDate(previewInv.due_date)}</div>}
                <div style={{marginTop:6}}><Badge color={previewInv.status==="paid"?"green":"amber"}>{previewInv.status==="paid"?t("invoices.status.paid"):t("invoices.status.unpaid")}</Badge></div>
              </div>
            </div>

            <div style={{background:T.surface2,borderRadius:T.r.md,padding:"12px 16px",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{t("invoices.billTo")}</div>
              <div style={{fontWeight:700}}>{previewInv.client?.name}</div>
              <div style={{fontSize:13,color:T.muted}}>{previewInv.client?.email}</div>
              <div style={{fontSize:13,color:T.muted}}>{previewInv.client?.address}</div>
            </div>

            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16}}>
              <thead><tr>
                <th style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",padding:"8px 0",borderBottom:`1px solid ${T.border}`,textAlign:"left"}}>{t("invoices.descriptionCol")}</th>
                <th style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",padding:"8px 0",borderBottom:`1px solid ${T.border}`,textAlign:"right"}}>{t("invoices.amountCol")}</th>
              </tr></thead>
              <tbody><tr>
                <td style={{padding:"14px 0",borderBottom:`1px solid ${T.border}`,fontSize:14}}>{previewInv.job?.title||t("invoices.servicesRendered")}</td>
                <td style={{padding:"14px 0",borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:700,textAlign:"right"}}>{fmt(previewInv.amount)}</td>
              </tr></tbody>
            </table>

            <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,paddingTop:14,borderTop:`2px solid ${T.text}`}}>
              <span>{t("invoices.totalDue")}</span>
              <span style={{color:previewInv.status==="paid"?T.green:T.brand}}>{fmt(previewInv.amount)}</span>
            </div>

            {previewInv.stripe_payment_link_url && (
              <div style={{marginTop:14,padding:"10px 14px",background:T.blueBg,borderRadius:T.r.md,fontSize:13,color:T.blue}}>
                 {t("invoices.payOnline")}{" "}
                <a href={previewInv.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" style={{color:T.blue,fontWeight:600}}>
                  {previewInv.stripe_payment_link_url}
                </a>
              </div>
            )}

            {(profile.bank_name || profile.account_number) && (
              <div style={{marginTop:14,padding:"12px 14px",background:T.greenBg,borderRadius:T.r.md,fontSize:13,color:T.green}}>
                <div style={{fontWeight:700,marginBottom:4}}> {t("invoices.bankTransferTitle")}</div>
                {profile.bank_name && <div>{t("invoices.bankLabel")} {profile.bank_name}</div>}
                {profile.sort_code && <div>{t("invoices.sortCodeLabel")} {profile.sort_code}</div>}
                {profile.account_number && <div>{t("invoices.accountLabel")} {profile.account_number}</div>}
                <div style={{marginTop:2}}>{t("invoices.referenceLabel")} {previewInv.invoice_number}</div>
              </div>
            )}

            <div style={{marginTop:14,fontSize:12,color:T.muted,borderTop:`1px solid ${T.border}`,paddingTop:12}}>
              <div>{t("invoices.referenceLabel")} {previewInv.invoice_number} · {profile.payment_terms||t("invoices.defaultPaymentTerms")}</div>
              {profile.invoice_notes && <div style={{marginTop:6}}>{profile.invoice_notes}</div>}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {delId && (
        <ConfirmModal title={t("invoices.deleteConfirmTitle")} message={t("invoices.deleteConfirmMessage")}
          confirmLabel={t("common.delete")} onConfirm={handleDelete} onClose={() => setDelId(null)}/>
      )}

      {/* ── Metrics ── */}
      <div style={{display:"flex",gap:12,marginBottom:16}}>
        <MetricCard label={t("invoices.totalPaid")}     value={fmt(paid)}        sub={t("invoices.invoicesCount",{count:invoices.filter(i=>i.status==="paid").length})} accent/>
        <MetricCard label={t("invoices.outstandingLabel")}    value={fmt(outstanding)} sub={t("invoices.unpaidCount",{count:invoices.filter(i=>i.status==="unpaid").length})}/>
        <MetricCard label={t("invoices.totalInvoiced")} value={fmt(paid+outstanding)} sub={t("invoices.allTime")}/>
      </div>

      {/* ── Filter tabs ── */}
      <Tabs tabs={[["all",t("invoices.tabAll")],["unpaid",t("invoices.tabUnpaid")],["paid",t("invoices.tabPaid")]]} active={filter} onChange={setFilter}/>

      {/* ── Table ── */}
      <Card style={{padding:0,overflow:"hidden"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:48,color:T.muted}}>{t("invoices.loading")}</div>
        ) : filtered.length === 0 ? (
          <Empty message={t("invoices.noneYet")}
            action={<Btn size="sm" onClick={openAdd}>+ {t("invoices.createFirst")}</Btn>}/>
        ) : (
          <Table headers={[t("invoices.colInvoice"),t("invoices.colClient"),t("invoices.colIssued"),t("invoices.colDue"),t("invoices.colAmount"),t("invoices.colStatus"),""]}>
            {filtered.map(inv => {
              const ov = isOverdue(inv);
              return (
                <tr key={inv.id}>
                  <TD style={{fontWeight:700,color:T.brand,cursor:"pointer"}} onClick={() => setModal(inv.id)}>
                    {inv.invoice_number}
                  </TD>
                  <TD>{inv.client?.name ?? "—"}</TD>
                  <TD>{fmtDate(inv.created_at)}</TD>
                  <TD>{inv.due_date ? fmtDate(inv.due_date) : "—"}</TD>
                  <TD style={{fontWeight:700}}>{fmt(inv.amount)}</TD>
                  <TD><Badge color={ov?"red":inv.status==="paid"?"green":"amber"}>{ov?t("invoices.status.overdue"):inv.status==="paid"?t("invoices.status.paid"):t("invoices.status.unpaid")}</Badge></TD>
                  <TD>
                    <div style={{display:"flex",gap:6}}>
                      <Btn size="sm" variant="ghost" onClick={() => setModal(inv.id)}>{t("invoices.viewButton")}</Btn>
                      {inv.status==="unpaid" && (
                        <Btn size="sm" variant="success" onClick={() => handleMarkPaid(inv.id)}>✓ {t("invoices.paidButton")}</Btn>
                      )}
                    </div>
                  </TD>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </PageShell>
  );
}