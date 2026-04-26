import { useState } from "react";

const CATS = [
  { id:"comida",          label:"Comida",     icon:"🍔", color:"#f97316" },
  { id:"transporte",      label:"Transporte",  icon:"🚌", color:"#3b82f6" },
  { id:"entretenimiento", label:"Entrete.",    icon:"🎮", color:"#a855f7" },
  { id:"ropa",            label:"Ropa",        icon:"👕", color:"#ec4899" },
  { id:"servicios",       label:"Servicios",   icon:"💡", color:"#eab308" },
  { id:"salud",           label:"Salud",       icon:"💊", color:"#22c55e" },
  { id:"otros",           label:"Otros",       icon:"📦", color:"#64748b" },
];
const FREQ = [
  { id:"weekly",   label:"Semanal",   labelEn:"Weekly",   labelZh:"每周",  desc:"Cada 7 días" },
  { id:"biweekly", label:"Quincenal", labelEn:"Biweekly", labelZh:"每两周", desc:"Cada 14 días" },
  { id:"monthly",  label:"Mensual",   labelEn:"Monthly",  labelZh:"每月",  desc:"Cada mes" },
];

const fmtMXN = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const fs = (b,s) => `${Math.round(b*s)}px`;
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

const freqLabel = (freq, lang) => {
  const f = FREQ.find(x=>x.id===freq);
  if (!f) return freq;
  return lang==="en" ? f.labelEn : lang==="zh" ? f.labelZh : f.label;
};

export default function RecurringPanel({ recurring, onAdd, onDelete, onToggle, T, sc, lang, onClose }) {
  const [mode, setMode] = useState("list");
  const [form, setForm] = useState({ name:"", amount:"", category:"servicios", frequency:"monthly", nextDate: todayStr() });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const cat = (id) => CATS.find(c=>c.id===id)||CATS[6];

  const handleAdd = async () => {
    if (!form.name.trim()) { setError("Escribe el nombre del gasto."); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Ingresa un monto válido."); return; }
    if (!form.nextDate) { setError("Selecciona la próxima fecha."); return; }
    setSaving(true);
    await onAdd({ name:form.name.trim(), amount:parseFloat(form.amount), category:form.category, frequency:form.frequency, nextDate:form.nextDate, active:true, createdAt:new Date().toISOString() });
    setForm({ name:"", amount:"", category:"servicios", frequency:"monthly", nextDate:todayStr() });
    setError("");
    setSaving(false);
    setMode("list");
  };

  const totalMonthly = recurring.filter(r=>r.active).reduce((s,r)=>{
    if(r.frequency==="weekly")   return s + r.amount * 4;
    if(r.frequency==="biweekly") return s + r.amount * 2;
    return s + r.amount;
  },0);

  const inp = { background:T.inputBg, border:`1px solid ${T.border2}`, color:T.text, borderRadius:9, padding:"10px 12px", fontSize:fs(14,sc), outline:"none", boxSizing:"border-box", width:"100%" };

  return (
    <div style={{ position:"fixed",inset:0,background:"#00000090",zIndex:150,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"20px 0" }}>
      <div style={{ background:T.header,borderRadius:20,padding:"22px 18px 32px",width:"100%",maxWidth:480,margin:"auto",border:`1px solid ${T.border}` }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {mode!=="list"&&<button onClick={()=>setMode("list")} style={{ background:"none",border:"none",color:T.textMute,cursor:"pointer",fontSize:18,padding:0 }}>←</button>}
            <div style={{ fontSize:fs(17,sc),fontWeight:800,color:T.text }}>🔁 Gastos Recurrentes</div>
          </div>
          <button onClick={onClose} style={{ background:T.surface,border:`1px solid ${T.border}`,color:T.textMute,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:fs(13,sc) }}>✕</button>
        </div>

        {mode==="list"&&(
          <div>
            {/* Monthly total */}
            <div style={{ background:"#1d4ed822",border:"1px solid #2563eb33",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:fs(11,sc),color:"#60a5fa",fontWeight:600 }}>Gasto fijo mensual estimado</div>
                <div style={{ fontSize:fs(20,sc),fontWeight:800,color:"#2563eb" }}>{fmtMXN(totalMonthly)}</div>
              </div>
              <div style={{ fontSize:28 }}>📋</div>
            </div>

            {recurring.length===0?(
              <div style={{ textAlign:"center",padding:"30px 0" }}>
                <div style={{ fontSize:48,marginBottom:12 }}>🔁</div>
                <div style={{ fontSize:fs(15,sc),fontWeight:700,color:T.text,marginBottom:6 }}>Sin gastos recurrentes</div>
                <div style={{ fontSize:fs(13,sc),color:T.textMute,marginBottom:20 }}>Agrega renta, suscripciones, etc.</div>
              </div>
            ):(
              recurring.map(r=>{
                const c=cat(r.category);
                return (
                  <div key={r.id} style={{ display:"flex",alignItems:"center",gap:10,background:T.surface,borderRadius:12,padding:"12px 14px",marginBottom:8,border:`1px solid ${r.active?T.border:T.barEmpty}`,opacity:r.active?1:0.5 }}>
                    <div style={{ width:38,height:38,borderRadius:10,background:`${c.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{c.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:fs(13,sc),fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.name}</div>
                      <div style={{ fontSize:fs(11,sc),color:T.textMute,marginTop:2 }}>{freqLabel(r.frequency,lang)} · Próximo: {r.nextDate}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:fs(14,sc),fontWeight:700,color:c.color }}>{fmtMXN(r.amount)}</div>
                    </div>
                    {/* Toggle active */}
                    <div onClick={()=>onToggle(r.id,!r.active)} style={{ width:36,height:20,borderRadius:10,background:r.active?"#2563eb":T.border2,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
                      <div style={{ position:"absolute",top:2,left:r.active?17:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s" }}/>
                    </div>
                    <button onClick={()=>onDelete(r.id)} style={{ background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:18,padding:0,flexShrink:0 }}>×</button>
                  </div>
                );
              })
            )}

            <button onClick={()=>setMode("add")} style={{ width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:12,padding:"13px",fontSize:fs(14,sc),fontWeight:800,cursor:"pointer",marginTop:4 }}>
              + Agregar gasto recurrente
            </button>
          </div>
        )}

        {mode==="add"&&(
          <div>
            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:5 }}>NOMBRE</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ej. Netflix, Renta, Gym..." style={{...inp,marginBottom:14}}/>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:5 }}>MONTO (MXN)</label>
            <input type="number" inputMode="decimal" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" style={{ ...inp,fontSize:fs(22,sc),fontWeight:800,marginBottom:14 }}/>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:8 }}>FRECUENCIA</label>
            <div style={{ display:"flex",gap:8,marginBottom:14 }}>
              {FREQ.map(f=>(
                <button key={f.id} onClick={()=>setForm(fm=>({...fm,frequency:f.id}))} style={{ flex:1,background:form.frequency===f.id?"#2563eb":T.surface,border:`1.5px solid ${form.frequency===f.id?"#2563eb":T.border}`,borderRadius:10,padding:"10px 4px",cursor:"pointer",color:form.frequency===f.id?"#fff":T.textMute,fontSize:fs(12,sc),fontWeight:form.frequency===f.id?700:400,textAlign:"center" }}>
                  {f.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:8 }}>CATEGORÍA</label>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:14 }}>
              {CATS.map(c=>(
                <button key={c.id} onClick={()=>setForm(f=>({...f,category:c.id}))} style={{ background:form.category===c.id?`${c.color}20`:T.surface,border:`1.5px solid ${form.category===c.id?c.color:T.border}`,borderRadius:10,padding:"8px 4px",cursor:"pointer",textAlign:"center" }}>
                  <div style={{ fontSize:fs(17,sc) }}>{c.icon}</div>
                  <div style={{ fontSize:fs(9,sc),color:form.category===c.id?c.color:T.textMute,marginTop:2,fontWeight:700 }}>{c.label}</div>
                </button>
              ))}
            </div>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:5 }}>PRÓXIMA FECHA DE COBRO</label>
            <input type="date" value={form.nextDate} onChange={e=>setForm(f=>({...f,nextDate:e.target.value}))} style={{...inp,marginBottom:20}}/>

            {error&&<div style={{ fontSize:fs(12,sc),color:"#ef4444",marginBottom:10 }}>⚠️ {error}</div>}
            <button onClick={handleAdd} disabled={saving} style={{ width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:12,padding:"13px",fontSize:fs(15,sc),fontWeight:800,cursor:"pointer",opacity:saving?0.7:1 }}>
              {saving?"Guardando...":"Guardar gasto recurrente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
