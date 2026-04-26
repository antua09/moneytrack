import { useState } from "react";

const GOAL_ICONS = ["🎯","🏠","✈️","🚗","💻","📱","🎓","💒","👶","🏖️","💎","🛡️"];
const GOAL_COLORS = ["#2563eb","#22c55e","#f97316","#a855f7","#ec4899","#eab308","#ef4444","#0891b2"];

const fmtMXN = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const fs = (b,s) => `${Math.round(b*s)}px`;

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function GoalsPanel({ goals, onAdd, onDelete, onAddContribution, balance, T, sc, lang, onClose }) {
  const [mode, setMode]           = useState("list"); // list | add | detail
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [form, setForm]           = useState({ name:"", target:"", date:"", icon:"🎯", color:"#2563eb" });
  const [contrib, setContrib]     = useState("");
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) { setError("Escribe el nombre de tu meta."); return; }
    if (!form.target || parseFloat(form.target) <= 0) { setError("Ingresa un monto objetivo."); return; }
    setSaving(true);
    await onAdd({ name: form.name.trim(), target: parseFloat(form.target), date: form.date || null, icon: form.icon, color: form.color, saved: 0, createdAt: new Date().toISOString() });
    setForm({ name:"", target:"", date:"", icon:"🎯", color:"#2563eb" });
    setError("");
    setSaving(false);
    setMode("list");
  };

  const handleContrib = async () => {
    const amt = parseFloat(contrib);
    if (!amt || amt <= 0) return;
    setSaving(true);
    await onAddContribution(selectedGoal.id, amt);
    setContrib("");
    setSaving(false);
  };

  const inp = { background: T.inputBg, border: `1px solid ${T.border2}`, color: T.text, borderRadius: 9, padding: "10px 12px", fontSize: fs(14,sc), outline: "none", boxSizing: "border-box", width: "100%" };

  const GoalCard = ({ goal }) => {
    const pct = Math.min((goal.saved / goal.target) * 100, 100);
    const days = daysUntil(goal.date);
    const done = pct >= 100;
    return (
      <div onClick={() => { setSelectedGoal(goal); setMode("detail"); }}
        style={{ background: T.surface, borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: `1px solid ${done ? goal.color+"66" : T.border}`, cursor: "pointer", transition: "all 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${goal.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{goal.icon}</div>
            <div>
              <div style={{ fontSize: fs(14,sc), fontWeight: 700, color: T.text }}>{goal.name}</div>
              {goal.date && <div style={{ fontSize: fs(11,sc), color: days < 0 ? "#ef4444" : days < 30 ? "#eab308" : T.textMute }}>{days < 0 ? "⚠️ Vencida" : days === 0 ? "¡Hoy!" : `${days} días restantes`}</div>}
            </div>
          </div>
          {done && <div style={{ background: `${goal.color}22`, color: goal.color, borderRadius: 8, padding: "3px 10px", fontSize: fs(11,sc), fontWeight: 700 }}>✅ Meta</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: fs(13,sc), fontWeight: 700, color: goal.color }}>{fmtMXN(goal.saved)}</span>
          <span style={{ fontSize: fs(12,sc), color: T.textMute }}>de {fmtMXN(goal.target)}</span>
        </div>
        <div style={{ background: T.barEmpty, borderRadius: 99, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: done ? goal.color : `linear-gradient(90deg,${goal.color}aa,${goal.color})`, transition: "width 0.5s" }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: fs(10,sc), color: T.textDim }}>{pct.toFixed(0)}% completado</span>
          <span style={{ fontSize: fs(10,sc), color: T.textMute }}>Falta: {fmtMXN(Math.max(0, goal.target - goal.saved))}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"#00000090",zIndex:150,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"20px 0" }}>
      <div style={{ background:T.header,borderRadius:20,padding:"22px 18px 32px",width:"100%",maxWidth:480,margin:"auto",border:`1px solid ${T.border}` }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {mode!=="list"&&<button onClick={()=>setMode("list")} style={{ background:"none",border:"none",color:T.textMute,cursor:"pointer",fontSize:18,padding:0 }}>←</button>}
            <div style={{ fontSize:fs(17,sc),fontWeight:800,color:T.text }}>
              {mode==="list"?"🎯 Metas de Ahorro":mode==="add"?"Nueva Meta":"📊 "+selectedGoal?.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background:T.surface,border:`1px solid ${T.border}`,color:T.textMute,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:fs(13,sc) }}>✕</button>
        </div>

        {/* Balance disponible */}
        {mode==="list"&&(
          <div style={{ background:balance>=0?"#0d2b1a":"#2b0d0d",border:`1px solid ${balance>=0?"#22c55e33":"#ef444433"}`,borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <div style={{ fontSize:fs(11,sc),color:balance>=0?"#22c55e":"#ef4444",fontWeight:600 }}>Balance disponible (histórico)</div>
              <div style={{ fontSize:fs(18,sc),fontWeight:800,color:balance>=0?"#22c55e":"#ef4444" }}>{fmtMXN(Math.abs(balance))}</div>
            </div>
            <div style={{ fontSize:28 }}>{balance>=0?"💰":"⚠️"}</div>
          </div>
        )}

        {/* LIST */}
        {mode==="list"&&(
          <div>
            {goals.length === 0 ? (
              <div style={{ textAlign:"center",padding:"30px 0" }}>
                <div style={{ fontSize:48,marginBottom:12 }}>🎯</div>
                <div style={{ fontSize:fs(15,sc),fontWeight:700,color:T.text,marginBottom:6 }}>Sin metas todavía</div>
                <div style={{ fontSize:fs(13,sc),color:T.textMute,marginBottom:20 }}>Crea tu primera meta de ahorro</div>
              </div>
            ) : goals.map(g => <GoalCard key={g.id} goal={g}/>)}
            <button onClick={()=>setMode("add")} style={{ width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:12,padding:"13px",fontSize:fs(14,sc),fontWeight:800,cursor:"pointer",marginTop:4 }}>
              + Nueva meta de ahorro
            </button>
          </div>
        )}

        {/* ADD */}
        {mode==="add"&&(
          <div>
            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:5 }}>NOMBRE DE LA META</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ej. Vacaciones, Auto nuevo..." style={{...inp,marginBottom:14}}/>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:5 }}>MONTO OBJETIVO (MXN)</label>
            <input type="number" inputMode="decimal" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="0" style={{ ...inp, fontSize:fs(22,sc), fontWeight:800, marginBottom:14 }}/>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:5 }}>FECHA LÍMITE (opcional)</label>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...inp,marginBottom:16}}/>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:8 }}>ÍCONO</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:16 }}>
              {GOAL_ICONS.map(ico=>(
                <button key={ico} onClick={()=>setForm(f=>({...f,icon:ico}))} style={{ width:38,height:38,borderRadius:10,background:form.icon===ico?`${form.color}33`:T.surface,border:`2px solid ${form.icon===ico?form.color:T.border}`,cursor:"pointer",fontSize:18 }}>{ico}</button>
              ))}
            </div>

            <label style={{ fontSize:fs(11,sc),color:T.textMute,display:"block",marginBottom:8 }}>COLOR</label>
            <div style={{ display:"flex",gap:8,marginBottom:20 }}>
              {GOAL_COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{ width:30,height:30,borderRadius:8,background:c,border:form.color===c?"3px solid #fff":"2px solid transparent",cursor:"pointer",boxShadow:form.color===c?`0 0 0 2px ${c}`:"none" }}/>
              ))}
            </div>

            {/* Preview */}
            <div style={{ background:`${form.color}18`,border:`1px solid ${form.color}44`,borderRadius:12,padding:"14px",marginBottom:16,display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:`${form.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{form.icon}</div>
              <div>
                <div style={{ fontSize:fs(14,sc),fontWeight:700,color:T.text }}>{form.name||"Mi Meta"}</div>
                <div style={{ fontSize:fs(12,sc),color:form.color }}>{form.target?fmtMXN(parseFloat(form.target)||0):"$0"}</div>
              </div>
            </div>

            {error&&<div style={{ fontSize:fs(12,sc),color:"#ef4444",marginBottom:10 }}>⚠️ {error}</div>}
            <button onClick={handleAdd} disabled={saving} style={{ width:"100%",background:`linear-gradient(135deg,${form.color},${form.color}cc)`,border:"none",color:"#fff",borderRadius:12,padding:"13px",fontSize:fs(15,sc),fontWeight:800,cursor:"pointer",opacity:saving?0.7:1 }}>
              {saving?"Guardando...":"Crear meta"}
            </button>
          </div>
        )}

        {/* DETAIL */}
        {mode==="detail"&&selectedGoal&&(()=>{
          const goal = goals.find(g=>g.id===selectedGoal.id)||selectedGoal;
          const pct = Math.min((goal.saved/goal.target)*100,100);
          const days = daysUntil(goal.date);
          const done = pct >= 100;
          const neededPerDay = goal.date && !done ? Math.max(0,(goal.target-goal.saved)/Math.max(1,days)) : 0;
          return (
            <div>
              {/* Big progress circle area */}
              <div style={{ textAlign:"center",padding:"10px 0 20px" }}>
                <div style={{ width:100,height:100,borderRadius:"50%",background:`conic-gradient(${goal.color} ${pct*3.6}deg, ${T.barEmpty} 0deg)`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
                  <div style={{ width:76,height:76,borderRadius:"50%",background:T.header,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>{goal.icon}</div>
                </div>
                <div style={{ fontSize:fs(24,sc),fontWeight:900,color:goal.color }}>{pct.toFixed(0)}%</div>
                <div style={{ fontSize:fs(13,sc),color:T.textMute,marginTop:4 }}>{fmtMXN(goal.saved)} de {fmtMXN(goal.target)}</div>
              </div>

              {/* Stats */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
                <div style={{ background:T.surface,borderRadius:12,padding:"12px",border:`1px solid ${T.border}`,textAlign:"center" }}>
                  <div style={{ fontSize:fs(11,sc),color:T.textMute }}>Falta</div>
                  <div style={{ fontSize:fs(16,sc),fontWeight:800,color:"#ef4444" }}>{fmtMXN(Math.max(0,goal.target-goal.saved))}</div>
                </div>
                {goal.date&&<div style={{ background:T.surface,borderRadius:12,padding:"12px",border:`1px solid ${T.border}`,textAlign:"center" }}>
                  <div style={{ fontSize:fs(11,sc),color:T.textMute }}>Días restantes</div>
                  <div style={{ fontSize:fs(16,sc),fontWeight:800,color:days<0?"#ef4444":days<30?"#eab308":goal.color }}>{days<0?"Vencida":days}</div>
                </div>}
                {neededPerDay>0&&<div style={{ background:T.surface,borderRadius:12,padding:"12px",border:`1px solid ${T.border}`,textAlign:"center" }}>
                  <div style={{ fontSize:fs(11,sc),color:T.textMute }}>Ahorra/día</div>
                  <div style={{ fontSize:fs(14,sc),fontWeight:800,color:goal.color }}>{fmtMXN(neededPerDay)}</div>
                </div>}
                {neededPerDay>0&&<div style={{ background:T.surface,borderRadius:12,padding:"12px",border:`1px solid ${T.border}`,textAlign:"center" }}>
                  <div style={{ fontSize:fs(11,sc),color:T.textMute }}>Ahorra/sem</div>
                  <div style={{ fontSize:fs(14,sc),fontWeight:800,color:goal.color }}>{fmtMXN(neededPerDay*7)}</div>
                </div>}
              </div>

              {!done&&(
                <>
                  <div style={{ fontSize:fs(12,sc),color:T.textMute,marginBottom:8 }}>Registrar aportación</div>
                  <div style={{ display:"flex",gap:8,marginBottom:16 }}>
                    <input type="number" inputMode="decimal" value={contrib} onChange={e=>setContrib(e.target.value)} placeholder="Monto a agregar" style={{ ...inp,fontSize:fs(16,sc),fontWeight:700 }}/>
                    <button onClick={handleContrib} disabled={saving||!contrib} style={{ background:`linear-gradient(135deg,${goal.color},${goal.color}cc)`,border:"none",color:"#fff",borderRadius:9,padding:"10px 16px",fontSize:fs(14,sc),fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",opacity:!contrib?0.5:1 }}>+ Agregar</button>
                  </div>
                </>
              )}
              {done&&<div style={{ background:`${goal.color}18`,border:`1px solid ${goal.color}44`,borderRadius:12,padding:"14px",textAlign:"center",marginBottom:16 }}><div style={{ fontSize:24,marginBottom:4 }}>🎉</div><div style={{ fontSize:fs(14,sc),fontWeight:700,color:goal.color }}>¡Meta alcanzada!</div></div>}

              <button onClick={()=>onDelete(goal.id)} style={{ width:"100%",background:"#ef444415",border:"1px solid #ef444430",color:"#ef4444",borderRadius:10,padding:"10px",fontSize:fs(13,sc),fontWeight:600,cursor:"pointer" }}>🗑️ Eliminar meta</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
