// src/pages/QuotesPage.jsx

import { useState } from "react";
import { useTranslation } from "../i18n/index.js";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import { uid, today } from "../lib/state";
import {
  PageShell, Card, Btn, Badge, Table, TD,
  Modal, ConfirmModal, Field, FieldRow,
  FormActions, Tabs, Empty, SectionTitle, Divider,
} from "../components/UI";

const fmt     = n => `€${Number(n||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return "—"; }};
const iStyle  = { width:"100%",padding:"10px 12px",borderRadius:T.r.md,border:`1px solid ${T.borderMed}`,fontSize:14,background:T.surface,color:T.text,boxSizing:"border-box",fontFamily:"inherit" };

const STATUS_COLOR = { draft:"gray", sent:"blue", viewed:"amber", accepted:"green", declined:"red", converted:"green" };
const LINE_TYPES   = ["labour","material","other"];

function calcTotals(lineItems, vatRate=0) {
  const subtotal   = lineItems.reduce((s,l) => s + (Number(l.quantity||0)*Number(l.unit_price||0)), 0);
  const vat_amount = Math.round(subtotal * (vatRate/100) * 100)/100;
  const total      = subtotal + vat_amount;
  // Margin = (total - material cost) / total
  const matCost    = lineItems.filter(l=>l.type==="material").reduce((s,l)=>s+(Number(l.quantity||0)*Number(l.unit_price||0)),0);
  const margin_pct = total > 0 ? Math.round(((total-matCost)/total)*100) : 0;
  return { subtotal: Math.round(subtotal*100)/100, vat_amount, total: Math.round(total*100)/100, margin_pct };
}

export default function QuotesPage({ state, dispatch, profile }) {
  const { t: tr } = useTranslation();
  const [tab,     setTab]     = useState("active");
  const [modal,   setModal]   = useState(null); 
  const [delId,   setDelId]   = useState(null);
  const [form,    setForm]    = useState({});
  const [lines,   setLines]   = useState([]);
  const [signName,setSignName]= useState("");
  const [busy,    setBusy]    = useState(false);
  const fld = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const quotes   = state?.quotes ?? [];
  const clients  = state?.clients ?? [];
  const active   = quotes.filter(q=>["draft","sent","viewed","accepted"].includes(q.status));
  const archived = quotes.filter(q=>["declined","converted"].includes(q.status));
  const current  = tab==="active" ? active : archived;

  function addLine() {
    setLines(prev=>[...prev,{id:uid(),description:"",type:"labour",quantity:"1",unit_price:"",total:0}]);
  }
  function removeLine(id) { setLines(prev=>prev.filter(l=>l.id!==id)); }
  function updateLine(id,key,val) {
    setLines(prev=>prev.map(l=>{
      if(l.id!==id) return l;
      const updated = {...l,[key]:val};
      updated.total = Math.round(Number(updated.quantity||0)*Number(updated.unit_price||0)*100)/100;
      return updated;
    }));
  }

  function openAdd() {
    setForm({ client_id:clients[0]?.id||"", title:"", notes:"", valid_until:"", vat_rate:"0" });
    setLines([{id:uid(),description:"",type:"labour",quantity:"1",unit_price:"",total:0}]);
    setModal("add");
  }
  function openEdit(q) {
    setForm({ id:q.id, client_id:q.client_id, title:q.title, notes:q.notes||"", valid_until:q.valid_until||"", vat_rate:String(q.vat_rate||0) });
    setLines((q.line_items||[]).map(l=>({...l,id:uid(),quantity:String(l.quantity),unit_price:String(l.unit_price)})));
    setModal("edit");
  }
  function openPreview(q) { setForm(q); setModal("preview"); }

  function save() {
    if (!form.title || !form.client_id) { toast.error(tr("quotes.toast.titleClientRequired")); return; }
    const totals = calcTotals(lines, Number(form.vat_rate||0));
    const line_items = lines.map(l=>({ description:l.description, type:l.type, quantity:Number(l.quantity), unit_price:Number(l.unit_price), total:l.total }));
    if (modal==="add") {
      const num = String((quotes.length)+1).padStart(3,"0");
      dispatch({ type:"ADD_QUOTE", payload:{ ...form, ...totals, id:uid(), quote_number:`QUO-${num}`, line_items, status:"draft", signed_at:null, job_id:null, created_at:new Date().toISOString() } });
      toast.success(tr("quotes.toast.quoteCreated"));
    } else {
      dispatch({ type:"UPDATE_QUOTE", payload:{ ...form, ...totals, line_items } });
      toast.success(tr("quotes.toast.quoteUpdated"));
    }
    setModal(null);
  }

  function markSent(id) {
    dispatch({ type:"UPDATE_QUOTE", payload:{ id, status:"sent" } });
    toast.success(tr("quotes.toast.markedAsSent"));
  }

  function handleSign() {
    if (!signName.trim()) { toast.error(tr("quotes.toast.enterClientName")); return; }
    dispatch({ type:"UPDATE_QUOTE", payload:{ id:form.id, status:"accepted", signed_at:new Date().toISOString(), signed_by:signName } });
    setModal(null);
    toast.success(tr("quotes.toast.quoteSignedBy", { name: signName }));
  }

  function convertToJob(q) {
    const cl = clients.find(c=>c.id===q.client_id);
    dispatch({ type:"ADD_JOB", payload:{ id:uid(), profile_id:profile?.id, client_id:q.client_id, title:q.title, date:today(), time:"09:00", duration:4, status:"scheduled", notes:`From quote ${q.quote_number}`, amount:q.total } });
    dispatch({ type:"UPDATE_QUOTE", payload:{ id:q.id, status:"converted" } });
    toast.success(tr("quotes.toast.convertedToJob"));
  }

  const getClient = id => clients.find(c=>c.id===id);
  const previewQ  = modal==="preview"||modal==="sign" ? form : null;

  return (
    <PageShell title={tr("quotes.title")} action={<Btn size="sm" onClick={openAdd}>{tr("quotes.newQuoteBtn")}</Btn>}>

      {/* Add / Edit modal */}
      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="add"?tr("quotes.modal.newTitle"):tr("quotes.modal.editTitle")} onClose={()=>setModal(null)} width={620}>
          <form onSubmit={e=>{e.preventDefault();save();}}>
            <FieldRow>
              <Field label={tr("quotes.fields.client")} flex="1">
                <select style={iStyle} value={form.client_id} onChange={fld("client_id")}>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label={tr("quotes.fields.validUntil")} flex="1">
                <input type="date" style={iStyle} value={form.valid_until} onChange={fld("valid_until")}/>
              </Field>
            </FieldRow>
            <Field label={tr("quotes.fields.quoteTitle")}>
              <input style={iStyle} value={form.title} onChange={fld("title")} placeholder={tr("quotes.fields.quoteTitlePlaceholder")} autoFocus/>
            </Field>

            {/* Line items */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <label style={{ fontSize:13, fontWeight:500, color:T.muted }}>{tr("quotes.lineItems.label")}</label>
                <Btn size="sm" variant="ghost" onClick={addLine}>{tr("quotes.lineItems.addLine")}</Btn>
              </div>

              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"2fr 80px 1fr 90px 32px", gap:6, marginBottom:6 }}>
                {[
                  tr("quotes.lineItems.headers.description"),
                  tr("quotes.lineItems.headers.type"),
                  tr("quotes.lineItems.headers.qtyPrice"),
                  tr("quotes.lineItems.headers.total"),
                  "",
                ].map(h=>(
                  <div key={h} style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
                ))}
              </div>

              {lines.map(l=>(
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 80px 1fr 90px 32px", gap:6, marginBottom:6, alignItems:"center" }}>
                  <input style={{...iStyle,padding:"7px 10px"}} value={l.description} onChange={e=>updateLine(l.id,"description",e.target.value)} placeholder={tr("quotes.lineItems.descriptionPlaceholder")}/>
                  <select style={{...iStyle,padding:"7px 8px"}} value={l.type} onChange={e=>updateLine(l.id,"type",e.target.value)}>
                    {LINE_TYPES.map(t=><option key={t} value={t}>{tr(`quotes.lineTypes.${t}`)}</option>)}
                  </select>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                    <input type="number" style={{...iStyle,padding:"7px 8px"}} value={l.quantity} onChange={e=>updateLine(l.id,"quantity",e.target.value)} placeholder={tr("quotes.lineItems.qtyPlaceholder")} min="0" step="0.5"/>
                    <input type="number" style={{...iStyle,padding:"7px 8px"}} value={l.unit_price} onChange={e=>updateLine(l.id,"unit_price",e.target.value)} placeholder={tr("quotes.lineItems.unitPricePlaceholder")} min="0"/>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, textAlign:"right" }}>{fmt(l.total)}</div>
                  <button type="button" onClick={()=>removeLine(l.id)} style={{ background:"none", border:"none", cursor:"pointer", color:T.hint, fontSize:18, lineHeight:1 }}>×</button>
                </div>
              ))}

              {/* Totals */}
              {lines.length>0 && (
                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:10, marginTop:6 }}>
                  {(() => {
                    const t = calcTotals(lines, Number(form.vat_rate||0));
                    return (
                      <>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                          <span style={{ color:T.muted }}>{tr("quotes.totals.subtotal")}</span><span style={{ fontWeight:600 }}>{fmt(t.subtotal)}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ color:T.muted }}>{tr("quotes.totals.vat")}</span>
                            <input type="number" style={{...iStyle,width:56,padding:"3px 8px",fontSize:13}} value={form.vat_rate} onChange={fld("vat_rate")} min="0" max="100"/>
                            <span style={{ color:T.muted, fontSize:12 }}>%</span>
                          </div>
                          <span style={{ fontWeight:600 }}>{fmt(t.vat_amount)}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:800, borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
                          <span>{tr("quotes.totals.total")}</span><span style={{ color:T.brand }}>{fmt(t.total)}</span>
                        </div>
                        <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>
                          {tr("quotes.totals.estMargin")} <strong style={{ color:t.margin_pct>20?T.green:T.amber }}>{t.margin_pct}%</strong>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <Field label={tr("quotes.fields.notesForClient")}>
              <textarea style={{...iStyle,height:60,resize:"vertical"}} value={form.notes} onChange={fld("notes")} placeholder={tr("quotes.fields.notesPlaceholder")}/>
            </Field>
            <FormActions onCancel={()=>setModal(null)} submitLabel={modal==="add"?tr("quotes.actions.createQuote"):tr("quotes.actions.saveChanges")}/>
          </form>
        </Modal>
      )}

      {/* Quote preview + sign modal */}
      {(modal==="preview"||modal==="sign") && previewQ && (() => {
        const cl = getClient(previewQ.client_id);
        return (
          <Modal title={previewQ.quote_number} onClose={()=>setModal(null)} width={580}>
            {/* Actions */}
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {previewQ.status==="draft" && <Btn size="sm" onClick={()=>{ markSent(previewQ.id); setModal(null); }}> {tr("quotes.preview.markAsSent")}</Btn>}
              {["draft","sent","viewed"].includes(previewQ.status) && <Btn size="sm" variant="success" onClick={()=>{ setSignName(""); setModal("sign"); }}> {tr("quotes.preview.clientSign")}</Btn>}
              {previewQ.status==="accepted" && !previewQ.job_id && <Btn size="sm" onClick={()=>{ convertToJob(previewQ); setModal(null); }}>{tr("quotes.preview.convertToJob")}</Btn>}
            </div>

            {modal==="sign" && (
              <div style={{ background:T.brandLight, borderRadius:T.r.md, padding:"14px 16px", marginBottom:16 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>{tr("quotes.preview.signature.title")}</div>
                <Field label={tr("quotes.preview.signature.fullNameLabel")}>
                  <input style={iStyle} value={signName} onChange={e=>setSignName(e.target.value)} placeholder="Sarah Mitchell" autoFocus/>
                </Field>
                <p style={{ fontSize:12, color:T.muted, marginBottom:10 }}>{tr("quotes.preview.signature.confirmText")}</p>
                <Btn onClick={handleSign}> {tr("quotes.preview.signature.signBtn")}</Btn>
              </div>
            )}

            {/* Quote document */}
            <div style={{ border:`1px solid ${T.border}`, borderRadius:T.r.lg, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:24, fontWeight:900, color:T.brand, letterSpacing:-1 }}>TRADIE</div>
                  <div style={{ fontSize:13, color:T.muted }}>{profile?.name} · {profile?.trade}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{profile?.email}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:18, fontWeight:800 }}>{previewQ.quote_number}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{tr("quotes.preview.issued", { date: fmtDate(previewQ.created_at) })}</div>
                  {previewQ.valid_until && <div style={{ fontSize:12, color:T.muted }}>{tr("quotes.preview.validUntil", { date: fmtDate(previewQ.valid_until) })}</div>}
                  <div style={{ marginTop:4 }}><Badge color={STATUS_COLOR[previewQ.status]||"gray"}>{tr(`quotes.status.${previewQ.status}`)}</Badge></div>
                </div>
              </div>

              <div style={{ background:T.surface2, borderRadius:T.r.md, padding:"12px 16px", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>{tr("quotes.preview.preparedFor")}</div>
                <div style={{ fontWeight:700 }}>{cl?.name}</div>
                <div style={{ fontSize:13, color:T.muted }}>{cl?.email} · {cl?.address}</div>
              </div>

              <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>{previewQ.title}</div>

              <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:16 }}>
                <thead><tr>
                  <th style={{ textAlign:"left", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>{tr("quotes.preview.table.description")}</th>
                  <th style={{ textAlign:"center", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>{tr("quotes.preview.table.type")}</th>
                  <th style={{ textAlign:"right", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>{tr("quotes.preview.table.qty")}</th>
                  <th style={{ textAlign:"right", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>{tr("quotes.preview.table.unit")}</th>
                  <th style={{ textAlign:"right", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>{tr("quotes.preview.table.total")}</th>
                </tr></thead>
                <tbody>
                  {(previewQ.line_items||[]).map((l,i)=>(
                    <tr key={i}>
                      <td style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}`, fontSize:14 }}>{l.description}</td>
                      <td style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}`, textAlign:"center" }}><Badge color={l.type==="labour"?"amber":l.type==="material"?"blue":"gray"}>{tr(`quotes.lineTypes.${l.type}`)}</Badge></td>
                      <td style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}`, textAlign:"right", fontSize:14, color:T.muted }}>{l.quantity}</td>
                      <td style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}`, textAlign:"right", fontSize:14, color:T.muted }}>{fmt(l.unit_price)}</td>
                      <td style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}`, textAlign:"right", fontSize:14, fontWeight:600 }}>{fmt(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, marginBottom:16 }}>
                <div style={{ display:"flex", gap:24, fontSize:14 }}><span style={{ color:T.muted }}>{tr("quotes.totals.subtotal")}</span><span style={{ fontWeight:600 }}>{fmt(previewQ.subtotal)}</span></div>
                {previewQ.vat_rate>0 && <div style={{ display:"flex", gap:24, fontSize:14 }}><span style={{ color:T.muted }}>{tr("quotes.preview.vatLine", { rate: previewQ.vat_rate })}</span><span style={{ fontWeight:600 }}>{fmt(previewQ.vat_amount)}</span></div>}
                <div style={{ display:"flex", gap:24, fontSize:18, fontWeight:800, borderTop:`2px solid ${T.text}`, paddingTop:8 }}><span>{tr("quotes.totals.total")}</span><span style={{ color:T.brand }}>{fmt(previewQ.total)}</span></div>
              </div>

              {previewQ.notes && <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:12 }}>{previewQ.notes}</div>}

              {previewQ.signed_at && (
                <div style={{ background:T.greenBg, borderRadius:T.r.md, padding:"10px 14px", fontSize:13 }}>
                  ✓ {tr("quotes.preview.acceptedBy", { name: previewQ.signed_by, date: fmtDate(previewQ.signed_at) })}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {delId && <ConfirmModal title={tr("quotes.deleteConfirm.title")} message={tr("quotes.deleteConfirm.message")} onConfirm={()=>{ dispatch({type:"DELETE_QUOTE",payload:delId}); setDelId(null); toast.success(tr("quotes.toast.quoteDeleted")); }} onClose={()=>setDelId(null)}/>}

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        {[
          { label:tr("quotes.stats.totalQuotedValue"), val:fmt(quotes.reduce((s,q)=>s+Number(q.total),0)), sub:tr("quotes.stats.quotesCount", { count: quotes.length }) },
          { label:tr("quotes.stats.acceptedValue"),     val:fmt(quotes.filter(q=>["accepted","converted"].includes(q.status)).reduce((s,q)=>s+Number(q.total),0)), sub:tr("quotes.stats.won") },
          { label:tr("quotes.stats.pending"),            val:quotes.filter(q=>["draft","sent","viewed"].includes(q.status)).length, sub:tr("quotes.stats.awaitingResponse") },
          { label:tr("quotes.stats.conversionRate"),    val:quotes.length>0?`${Math.round((quotes.filter(q=>["accepted","converted"].includes(q.status)).length/quotes.length)*100)}%`:"—", sub:tr("quotes.stats.acceptedOverTotal") },
        ].map(m=>(
          <div key={m.label} style={{ flex:1, background:T.surface, borderRadius:T.r.lg, border:`1px solid ${T.border}`, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:800 }}>{m.val}</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <Tabs tabs={[["active",tr("quotes.tabs.active"),active.length],["archived",tr("quotes.tabs.archived"),archived.length]]} active={tab} onChange={setTab}/>

      <Card style={{ padding:0, overflow:"hidden" }}>
        {current.length===0
          ? <Empty message={tr("quotes.empty")} action={<Btn size="sm" onClick={openAdd}>{tr("quotes.createFirst")}</Btn>}/>
          : (
            <Table headers={[
              tr("quotes.table.headers.quoteNumber"), tr("quotes.table.headers.client"), tr("quotes.table.headers.title"),
              tr("quotes.table.headers.total"), tr("quotes.table.headers.margin"), tr("quotes.table.headers.status"), "",
            ]}>
              {current.map(q=>{
                const cl = getClient(q.client_id);
                return (
                  <tr key={q.id}>
                    <TD style={{ fontWeight:700, color:T.brand, cursor:"pointer" }} onClick={()=>openPreview(q)}>{q.quote_number}</TD>
                    <TD>{cl?.name||"—"}</TD>
                    <TD style={{ maxWidth:200 }}><div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.title}</div></TD>
                    <TD style={{ fontWeight:700 }}>{fmt(q.total)}</TD>
                    <TD><span style={{ color:q.margin_pct>25?T.green:T.amber, fontWeight:600 }}>{q.margin_pct}%</span></TD>
                    <TD><Badge color={STATUS_COLOR[q.status]||"gray"}>{tr(`quotes.status.${q.status}`)}</Badge></TD>
                    <TD>
                      <div style={{ display:"flex", gap:6 }}>
                        <Btn size="sm" variant="ghost" onClick={()=>openPreview(q)}>{tr("quotes.row.view")}</Btn>
                        {q.status==="draft" && <Btn size="sm" variant="ghost" onClick={()=>openEdit(q)}>{tr("quotes.row.edit")}</Btn>}
                        {q.status==="accepted" && !q.job_id && <Btn size="sm" variant="success" onClick={()=>convertToJob(q)}>{tr("quotes.row.toJob")}</Btn>}
                        <Btn size="sm" variant="danger" onClick={()=>setDelId(q.id)}>✕</Btn>
                      </div>
                    </TD>
                  </tr>
                );
              })}
            </Table>
          )
        }
      </Card>
    </PageShell>
  );
}