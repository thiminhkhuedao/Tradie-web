// components/UI.jsx — every shared component

import { useEffect } from "react";
import { T } from "../styles/tokens";
import { useTranslation } from "../i18n/index.js";

/* ── Btn ─────────────────────────────────────────── */
export function Btn({ variant="primary", size="md", onClick, children, style={}, disabled=false, fullWidth=false, type="button" }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:6, borderRadius:T.r.md,
    fontWeight:600, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit",
    border:"none", transition:"all 0.15s", opacity:disabled?0.5:1, whiteSpace:"nowrap",
    ...(fullWidth && {width:"100%", justifyContent:"center"}),
    ...(size==="sm" && {padding:"6px 12px", fontSize:13}),
    ...(size==="md" && {padding:"9px 18px", fontSize:14}),
    ...(size==="lg" && {padding:"12px 24px", fontSize:15}),
  };
  const variants = {
    primary: {background:T.brand,    color:"#fff"},
    ghost:   {background:"transparent", color:T.text, border:`1px solid ${T.borderMed}`},
    danger:  {background:T.redBg,    color:T.red,  border:`1px solid ${T.red}30`},
    success: {background:T.greenBg,  color:T.green},
    white:   {background:"#fff",     color:T.brand},
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{...base,...(variants[variant]||variants.primary),...style}}>
      {children}
    </button>
  );
}

/* ── Badge ───────────────────────────────────────── */
export function Badge({color="gray", children}) {
  const colors = {
    green: [T.greenBg, T.green],
    amber: [T.amberBg, T.amber],
    red:   [T.redBg,   T.red],
    brand: [T.brandLight, T.brand],
    blue:  [T.blueBg,  T.blue],
    gray:  [T.surface2, T.muted],
  };
  const [bg, fg] = colors[color]||colors.gray;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"3px 10px",
      borderRadius:T.r.full, fontSize:12, fontWeight:600,
      background:bg, color:fg, whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

/* ── Avatar ──────────────────────────────────────── */
const AV_COLORS = ["#E8500A","#1A7F4B","#7C3AED","#0369A1","#B45309","#BE185D","#0F766E","#C2410C"];
export function Avatar({name="?", size=36, index=0}) {
  const letters = (name||"?").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const color   = AV_COLORS[index % AV_COLORS.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", background:color,
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#fff", fontSize:size*0.36, fontWeight:700, flexShrink:0,
    }}>{letters}</div>
  );
}

/* ── Modal ───────────────────────────────────────── */
export function Modal({title, onClose, children, width=480}) {
  useEffect(()=>{
    const h = e=>e.key==="Escape"&&onClose();
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[onClose]);

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
      zIndex:300, display:"flex", alignItems:"center",
      justifyContent:"center", padding:20,
    }}>
      <div style={{
        background:T.surface, borderRadius:T.r.xl,
        border:`1px solid ${T.border}`, boxShadow:T.shadow.xl,
        padding:"28px 32px", width, maxWidth:"100%",
        maxHeight:"90vh", overflowY:"auto",
        animation:"fadeIn 0.15s ease-out",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:700}}>{title}</h2>
          <button onClick={onClose} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:24, color:T.hint, lineHeight:1, padding:"2px 6px",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── ConfirmModal ─────────────────────────────────── */
export function ConfirmModal({title, message, confirmLabel="Delete", onConfirm, onClose, danger=true}) {
  return (
    <Modal title={title} onClose={onClose} width={360}>
      {message && <p style={{color:T.muted, fontSize:14, marginBottom:20}}>{message}</p>}
      <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant={danger?"danger":"primary"} onClick={onConfirm}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

/* ── Field ───────────────────────────────────────── */
export function Field({label, children, flex}) {
  return (
    <div style={{marginBottom:14, ...(flex&&{flex})}}>
      <label style={{fontSize:13, fontWeight:500, color:T.muted, marginBottom:6, display:"block"}}>{label}</label>
      {children}
    </div>
  );
}

/* ── FieldRow ────────────────────────────────────── */
export function FieldRow({children}) {
  return <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>{children}</div>;
}

/* ── Input, Select, Textarea ─────────────────────── */
const inputBase = {
  width:"100%", padding:"10px 12px", borderRadius:T.r.md,
  border:`1px solid ${T.borderMed}`, fontSize:14,
  background:T.surface, color:T.text,
  boxSizing:"border-box", fontFamily:"inherit",
};
export const Input    = ({style={}, ...p}) => <input    style={{...inputBase,...style}} {...p}/>;
export const Select   = ({style={}, children, ...p}) => <select style={{...inputBase,...style}} {...p}>{children}</select>;
export const Textarea = ({style={}, ...p}) => <textarea style={{...inputBase, height:80, resize:"vertical",...style}} {...p}/>;

/* ── FormActions ─────────────────────────────────── */
export function FormActions({onCancel, submitLabel, cancelLabel, savingLabel, loading=false}) {
  const { t } = useTranslation();
  return (
    <div style={{display:"flex", gap:10, justifyContent:"flex-end", marginTop:20,
      paddingTop:16, borderTop:`1px solid ${T.border}`}}>
      <Btn variant="ghost" onClick={onCancel}>{cancelLabel ?? t("common.cancel")}</Btn>
      <Btn type="submit" disabled={loading}>{loading?(savingLabel ?? t("common.saving")):(submitLabel ?? t("common.save"))}</Btn>
    </div>
  );
}

/* ── Card ────────────────────────────────────────── */
export function Card({children, style={}, onClick}) {
  return (
    <div onClick={onClick} style={{
      background:T.surface, borderRadius:T.r.lg,
      border:`1px solid ${T.border}`,
      padding:"20px 24px", marginBottom:16,
      boxShadow:T.shadow.sm, ...style,
    }}>{children}</div>
  );
}

/* ── PageShell ───────────────────────────────────── */
export function PageShell({title, action, children}) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", minHeight:"100vh"}} className="page-enter">
      <div style={{
        background:T.surface, borderBottom:`1px solid ${T.border}`,
        padding:"15px 28px", display:"flex", alignItems:"center",
        justifyContent:"space-between", position:"sticky", top:0, zIndex:20,
        boxShadow:T.shadow.sm,
      }}>
        <h1 style={{margin:0, fontSize:18, fontWeight:700, color:T.text}}>{title}</h1>
        {action}
      </div>
      <div style={{padding:"24px 28px", flex:1}}>{children}</div>
    </div>
  );
}

/* ── MetricCard ──────────────────────────────────── */
export function MetricCard({label, value, sub, icon, accent=false}) {
  return (
    <div style={{
      background:T.surface, borderRadius:T.r.lg, flex:1,
      border:`1px solid ${T.border}`, padding:"18px 20px",
      boxShadow:T.shadow.sm,
      ...(accent && {borderLeft:`3px solid ${T.brand}`}),
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase",
            letterSpacing:"0.6px", marginBottom:8}}>{label}</div>
          <div style={{fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-0.5px"}}>{value}</div>
          {sub && <div style={{fontSize:12, color:T.muted, marginTop:4}}>{sub}</div>}
        </div>
        {icon && <div style={{fontSize:22, opacity:0.35}}>{icon}</div>}
      </div>
    </div>
  );
}

/* ── Table ───────────────────────────────────────── */
export function Table({headers, children}) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr>{headers.map(h=>(
            <th key={h} style={{
              fontSize:11, fontWeight:700, color:T.muted,
              textTransform:"uppercase", letterSpacing:"0.6px",
              padding:"10px 16px", textAlign:"left",
              borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap",
            }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ── TD ──────────────────────────────────────────── */
export function TD({children, style={}, onClick}) {
  return (
    <td onClick={onClick} style={{
      fontSize:14, color:T.text,
      padding:"13px 16px", borderBottom:`1px solid ${T.border}`,
      verticalAlign:"middle", ...style,
    }}>{children}</td>
  );
}

/* ── Tabs ────────────────────────────────────────── */
export function Tabs({tabs, active, onChange}) {
  return (
    <div style={{display:"flex", gap:4, background:T.surface2,
      padding:4, borderRadius:T.r.md, width:"fit-content", marginBottom:16}}>
      {tabs.map(([id,label,count])=>(
        <button key={id} onClick={()=>onChange(id)} style={{
          padding:"7px 16px", borderRadius:T.r.sm, border:"none",
          fontSize:14, fontWeight:active===id?700:400, cursor:"pointer",
          background:active===id?T.surface:"transparent",
          color:active===id?T.text:T.muted,
          boxShadow:active===id?T.shadow.sm:"none",
          display:"flex", alignItems:"center", gap:8,
        }}>
          {label}
          {count!==undefined && (
            <span style={{
              background:active===id?T.brand:T.surface3,
              color:active===id?"#fff":T.muted,
              borderRadius:T.r.full, fontSize:11,
              fontWeight:700, padding:"1px 7px",
            }}>{count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────── */
export function Toggle({on, onChange}) {
  return (
    <div onClick={()=>onChange(!on)} style={{
      width:40, height:22, borderRadius:T.r.full,
      background:on?T.brand:T.surface3,
      position:"relative", cursor:"pointer",
      transition:"background 0.2s", flexShrink:0,
    }}>
      <div style={{
        width:18, height:18, borderRadius:"50%",
        background:"#fff", position:"absolute",
        top:2, left:on?20:2, transition:"left 0.2s",
        boxShadow:T.shadow.sm,
      }}/>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────── */
export function Spinner() {
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:48}}>
      <div style={{
        width:28, height:28, borderRadius:"50%",
        border:`3px solid ${T.border}`, borderTopColor:T.brand,
        animation:"spin 0.65s linear infinite",
      }}/>
    </div>
  );
}

/* ── Empty ───────────────────────────────────────── */
export function Empty({ message, action}) {
  return (
    <div style={{textAlign:"center", padding:"52px 24px", color:T.muted}}>
      <div style={{fontSize:14, marginBottom:action?18:0}}>{message}</div>
      {action}
    </div>
  );
}

/* ── Divider ─────────────────────────────────────── */
export function Divider({style={}}) {
  return <div style={{height:1, background:T.border, margin:"16px 0", ...style}}/>;
}

/* ── Toast ───────────────────────────────────────── */
export function ToastStack({messages}) {
  return (
    <div style={{position:"fixed", bottom:24, right:24, zIndex:999,
      display:"flex", flexDirection:"column", gap:8}}>
      {messages.map(m=>(
        <div key={m.id} style={{
          padding:"12px 18px", borderRadius:T.r.lg,
          background:m.type==="error"?T.red:T.green,
          color:"#fff", fontSize:14, fontWeight:500,
          boxShadow:T.shadow.lg, display:"flex",
          alignItems:"center", gap:8,
          animation:"fadeIn 0.2s ease-out",
        }}>
          {m.type==="error"?"✕":"✓"} {m.text}
        </div>
      ))}
    </div>
  );
}

/* ── SectionTitle ────────────────────────────────── */
export function SectionTitle({children, action}) {
  return (
    <div style={{display:"flex", justifyContent:"space-between",
      alignItems:"center", marginBottom:14}}>
      <div style={{fontSize:15, fontWeight:700, color:T.text}}>{children}</div>
      {action}
    </div>
  );
}

/* ── InfoRow ─────────────────────────────────────── */
export function InfoRow({icon, value}) {
  if (!value) return null;
  return (
    <div style={{display:"flex", gap:10, fontSize:13, padding:"8px 0",
      borderBottom:`1px solid ${T.border}`, color:T.muted}}>
      <span>{icon}</span><span style={{flex:1}}>{value}</span>
    </div>
  );
}

/* ── SettingRow (label + toggle) ─────────────────── */
export function SettingRow({label, sub, on, onChange}) {
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"14px 0", borderBottom:`1px solid ${T.border}`}}>
      <div>
        <div style={{fontSize:14, fontWeight:500}}>{label}</div>
        {sub && <div style={{fontSize:12, color:T.muted, marginTop:2}}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange}/>
    </div>
  );
}