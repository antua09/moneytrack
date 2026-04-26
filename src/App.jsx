import { useState, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
} from "firebase/auth";
import {
  collection, doc, setDoc, getDoc, deleteDoc,
  onSnapshot, query, orderBy,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { t, LANGS, TR } from "./i18n";
import CSVImporter from "./CSVImporter";
import GoalsPanel from "./GoalsPanel";
import RecurringPanel from "./RecurringPanel";
import { ExchangeWidget } from "./ExchangeRate";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:"comida",          label:{es:"Comida",    en:"Food",     zh:"饮食"}, icon:"🍔", color:"#f97316" },
  { id:"transporte",      label:{es:"Transporte",en:"Transport",zh:"交通"}, icon:"🚌", color:"#3b82f6" },
  { id:"entretenimiento", label:{es:"Entrete.",  en:"Fun",      zh:"娱乐"}, icon:"🎮", color:"#a855f7" },
  { id:"ropa",            label:{es:"Ropa",      en:"Clothes",  zh:"服装"}, icon:"👕", color:"#ec4899" },
  { id:"servicios",       label:{es:"Servicios", en:"Services", zh:"服务"}, icon:"💡", color:"#eab308" },
  { id:"salud",           label:{es:"Salud",     en:"Health",   zh:"健康"}, icon:"💊", color:"#22c55e" },
  { id:"otros",           label:{es:"Otros",     en:"Others",   zh:"其他"}, icon:"📦", color:"#64748b" },
];
const INCOME_CATEGORIES = [
  { id:"sueldo",    label:{es:"Sueldo",   en:"Salary",    zh:"工资"},    icon:"💼", color:"#22c55e" },
  { id:"freelance", label:{es:"Freelance",en:"Freelance", zh:"自由职业"}, icon:"💻", color:"#3b82f6" },
  { id:"negocio",   label:{es:"Negocio",  en:"Business",  zh:"生意"},    icon:"🏪", color:"#f97316" },
  { id:"inversion", label:{es:"Inversión",en:"Investment",zh:"投资"},    icon:"📈", color:"#a855f7" },
  { id:"regalo",    label:{es:"Regalo",   en:"Gift",      zh:"礼物"},    icon:"🎁", color:"#ec4899" },
  { id:"otro",      label:{es:"Otro",     en:"Other",     zh:"其他"},    icon:"💰", color:"#eab308" },
];
const CARD_COLORS = ["#2563eb","#7c3aed","#db2777","#059669","#d97706","#dc2626","#0891b2","#65a30d","#9333ea","#475569"];
const DAYS_SHORT   = {es:["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],zh:["日","一","二","三","四","五","六"]};
const DAYS_FULL    = {es:["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],zh:["周日","周一","周二","周三","周四","周五","周六"]};
const MONTHS_SHORT = {es:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],zh:["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]};
const FONT_SCALES  = { small:0.85, normal:1, large:1.18 };
const DARK  = { bg:"#0a0c12",surface:"#111520",header:"#141824",border:"#1a1f2e",border2:"#2d3748",text:"#f1f5f9",textSub:"#e2e8f0",textMute:"#475569",textDim:"#334155",inputBg:"#111520",barEmpty:"#1a1f2e" };
const LIGHT = { bg:"#f1f5f9",surface:"#ffffff",header:"#ffffff",border:"#e2e8f0",border2:"#cbd5e1",text:"#0f172a",textSub:"#1e293b",textMute:"#64748b",textDim:"#94a3b8",inputBg:"#f8fafc",barEmpty:"#e2e8f0" };
const AVATARS = [
  {id:"a1",emoji:"😀",bg:"linear-gradient(135deg,#667eea,#764ba2)"},
  {id:"a2",emoji:"🐱",bg:"linear-gradient(135deg,#f97316,#ea580c)"},
  {id:"a3",emoji:"🐶",bg:"linear-gradient(135deg,#22c55e,#16a34a)"},
  {id:"a4",emoji:"🦊",bg:"linear-gradient(135deg,#ec4899,#db2777)"},
  {id:"a5",emoji:"🐼",bg:"linear-gradient(135deg,#475569,#1e293b)"},
  {id:"a6",emoji:"🦁",bg:"linear-gradient(135deg,#eab308,#ca8a04)"},
  {id:"a7",emoji:"🐸",bg:"linear-gradient(135deg,#10b981,#059669)"},
  {id:"a8",emoji:"🦄",bg:"linear-gradient(135deg,#a855f7,#7c3aed)"},
  {id:"a9",emoji:"🐺",bg:"linear-gradient(135deg,#64748b,#334155)"},
  {id:"a10",emoji:"🦋",bg:"linear-gradient(135deg,#0ea5e9,#2563eb)"},
  {id:"a11",emoji:"🐉",bg:"linear-gradient(135deg,#dc2626,#9f1239)"},
  {id:"a12",emoji:"🌙",bg:"linear-gradient(135deg,#1e1b4b,#312e81)"},
  {id:"a13",emoji:"⚡",bg:"linear-gradient(135deg,#fbbf24,#d97706)"},
  {id:"a14",emoji:"🔥",bg:"linear-gradient(135deg,#ef4444,#f97316)"},
  {id:"a15",emoji:"💎",bg:"linear-gradient(135deg,#06b6d4,#3b82f6)"},
  {id:"a16",emoji:"🌿",bg:"linear-gradient(135deg,#84cc16,#22c55e)"},
];
const getAvatar = (id) => AVATARS.find(a => a.id === id) || AVATARS[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMXN = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const fmtUSD = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
const fmtAmt = (amount, currency) => currency === "USD" ? fmtUSD(amount) : fmtMXN(amount);
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const weekStart = (s) => { const d = new Date(s+"T12:00:00"); const day = d.getDay(); d.setDate(d.getDate()+(day===0?-6:1-day)); return d.toISOString().slice(0,10); };
const weekEnd   = (s) => { const d = new Date(s+"T12:00:00"); d.setDate(d.getDate()+6); return d.toISOString().slice(0,10); };
const fmtWeekLabel = (s, lang) => { const a = new Date(s+"T12:00:00"), b = new Date(s+"T12:00:00"); b.setDate(b.getDate()+6); const M = MONTHS_SHORT[lang] || MONTHS_SHORT.es; return `${a.getDate()} ${M[a.getMonth()]} – ${b.getDate()} ${M[b.getMonth()]}`; };
const addDays = (s, n) => { const d = new Date(s+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const monthKey = (d) => d.slice(0,7);
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fs = (base, scale) => `${Math.round(base * scale)}px`;
const isDarkBg = (hex) => { try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return (r*299+g*587+b*114)/1000<128; } catch { return true; } };
const catLabel = (c, lang) => typeof c.label === "object" ? (c.label[lang] || c.label.es) : c.label;
const validUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

// ─── AvatarBubble ─────────────────────────────────────────────────────────────
const AvatarBubble = ({ avatarId, size=32, fontSize=14 }) => {
  const av = getAvatar(avatarId);
  return <div style={{width:size,height:size,borderRadius:Math.round(size*0.25),background:av.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize,flexShrink:0}}>{av.emoji}</div>;
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color="#3b82f6", T, sc }) => (
  <div style={{background:T.surface,borderRadius:14,padding:"13px 15px",border:`1px solid ${color}22`}}>
    <div style={{fontSize:fs(10,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{icon} {label}</div>
    <div style={{fontSize:fs(16,sc),fontWeight:800,color}}>{value}</div>
    {sub && <div style={{fontSize:fs(10,sc),color:T.textDim,marginTop:2}}>{sub}</div>}
  </div>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label, desc, T, sc }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
    <div>
      <div style={{fontSize:fs(13,sc),fontWeight:600,color:T.text}}>{label}</div>
      {desc && <div style={{fontSize:fs(11,sc),color:T.textMute,marginTop:2}}>{desc}</div>}
    </div>
    <div onClick={onChange} style={{width:44,height:24,borderRadius:12,background:value?"#2563eb":T.border2,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,marginLeft:12}}>
      <div style={{position:"absolute",top:3,left:value?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px #0003"}}/>
    </div>
  </div>
);

// ─── CardChip ─────────────────────────────────────────────────────────────────
const CardChip = ({ card, selected, onClick, T, sc }) => (
  <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:selected?`${card.color}22`:T.surface,border:`1.5px solid ${selected?card.color:T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",width:"100%",marginBottom:7}}>
    <div style={{width:32,height:22,borderRadius:5,background:`linear-gradient(135deg,${card.color},${card.color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(12,sc),flexShrink:0}}>💳</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:fs(13,sc),fontWeight:700,color:selected?card.color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.name}</div>
      <div style={{fontSize:fs(10,sc),color:T.textMute}}>**** {card.last4||"****"}</div>
    </div>
    {selected && <div style={{width:8,height:8,borderRadius:"50%",background:card.color,flexShrink:0}}/>}
  </button>
);

// ─── AvatarPicker ─────────────────────────────────────────────────────────────
function AvatarPicker({ current, onChange, T, sc, lang }) {
  return (
    <div>
      <div style={{fontSize:fs(11,sc),color:T.textMute,marginBottom:10}}>{t("chooseAvatar",lang)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:8}}>
        {AVATARS.map(av => (
          <button key={av.id} onClick={() => onChange(av.id)} style={{padding:0,background:"none",border:`2.5px solid ${current===av.id?"#3b82f6":"transparent"}`,borderRadius:10,cursor:"pointer"}}>
            <AvatarBubble avatarId={av.id} size={36} fontSize={18}/>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Card Manager ─────────────────────────────────────────────────────────────
function CardManager({ cards, onAdd, onDelete, onClose, T, sc, lang }) {
  const [name,setName]=useState(""); const [last4,setLast4]=useState(""); const [color,setColor]=useState(CARD_COLORS[0]); const [error,setError]=useState("");
  const inp = {background:T.inputBg,border:`1px solid ${T.border2}`,color:T.text,borderRadius:9,padding:"10px 12px",fontSize:fs(14,sc),outline:"none",boxSizing:"border-box"};
  const addCard = () => { if(!name.trim()){setError(t("errCardName",lang));return;} if(last4&&!/^\d{4}$/.test(last4)){setError(t("errCard4",lang));return;} onAdd({id:Date.now().toString(),name:name.trim(),last4:last4||"",color}); setName("");setLast4("");setColor(CARD_COLORS[0]);setError(""); };
  return (
    <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.header,borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:fs(16,sc),fontWeight:800,color:T.text}}>{t("myCards",lang)}</div>
          <button onClick={onClose} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.textMute,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:fs(13,sc)}}>{t("close",lang)}</button>
        </div>
        {cards.length===0?<div style={{textAlign:"center",padding:"14px 0 18px",color:T.textMute,fontSize:fs(13,sc)}}>{t("noCardsYet",lang)}</div>:cards.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,borderRadius:12,padding:"11px 12px",marginBottom:8,border:`1px solid ${T.border}`}}>
            <div style={{width:36,height:24,borderRadius:5,background:`linear-gradient(135deg,${c.color},${c.color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(13,sc),flexShrink:0}}>💳</div>
            <div style={{flex:1}}><div style={{fontSize:fs(13,sc),fontWeight:700,color:c.color}}>{c.name}</div>{c.last4&&<div style={{fontSize:fs(11,sc),color:T.textMute}}>**** {c.last4}</div>}</div>
            <button onClick={()=>onDelete(c.id)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:fs(20,sc),lineHeight:1}}>×</button>
          </div>
        ))}
        <div style={{marginTop:14,background:T.surface,borderRadius:14,padding:"16px",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:fs(11,sc),fontWeight:700,color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{t("addCardTitle",lang)}</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("cardName",lang)} style={{...inp,width:"100%",marginBottom:10}}/>
          <input value={last4} onChange={e=>setLast4(e.target.value.replace(/\D/,"").slice(0,4))} placeholder={t("last4",lang)} inputMode="numeric" style={{...inp,width:"100%",marginBottom:12}}/>
          <div style={{fontSize:fs(11,sc),color:T.textMute,marginBottom:8}}>{t("color",lang)}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{CARD_COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:7,background:c,border:color===c?"3px solid #fff":"2px solid transparent",cursor:"pointer",boxShadow:color===c?`0 0 0 2px ${c}`:"none"}}/>)}</div>
          <div style={{background:`linear-gradient(135deg,${color}dd,${color}88)`,borderRadius:12,padding:"12px 16px",marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{fontSize:fs(10,sc),color:"#ffffff99",letterSpacing:2,textTransform:"uppercase"}}>{t("card",lang)}</div>
            <div style={{fontSize:fs(15,sc),fontWeight:800,color:"#fff",marginTop:4}}>{name||t("card",lang)}</div>
            <div style={{fontSize:fs(12,sc),color:"#ffffff99",marginTop:4}}>**** **** **** {last4||"****"}</div>
            <div style={{position:"absolute",right:-12,top:-12,width:70,height:70,borderRadius:"50%",background:"#ffffff15"}}/>
          </div>
          {error&&<div style={{fontSize:fs(12,sc),color:"#ef4444",marginBottom:8}}>⚠️ {error}</div>}
          <button onClick={addCard} style={{width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:10,padding:"12px",fontSize:fs(14,sc),fontWeight:800,cursor:"pointer"}}>{t("addCardBtn",lang)}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ isDark, toggleTheme, fontScale, setFontScale, incomeMode, setIncomeMode, lang, setLang, T, sc, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.header,borderRadius:"20px 20px 0 0",padding:"20px 18px 40px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:fs(16,sc),fontWeight:800,color:T.text}}>{t("settings",lang)}</div>
          <button onClick={onClose} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.textMute,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:fs(13,sc)}}>✕</button>
        </div>
        <div style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{t("language",lang)}</div>
        <div style={{display:"flex",gap:8,marginBottom:22}}>
          {Object.entries(LANGS).map(([code,name])=>(
            <button key={code} onClick={()=>setLang(code)} style={{flex:1,background:lang===code?"#2563eb":T.surface,border:`1.5px solid ${lang===code?"#2563eb":T.border}`,borderRadius:10,padding:"10px 6px",color:lang===code?"#fff":T.textMute,fontSize:fs(13,sc),fontWeight:lang===code?700:400,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:18}}>{code==="es"?"🇲🇽":code==="en"?"🇺🇸":"🇨🇳"}</div>
              <div style={{fontSize:fs(10,sc),marginTop:3}}>{name}</div>
            </button>
          ))}
        </div>
        <div style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{t("theme",lang)}</div>
        <div style={{display:"flex",gap:10,marginBottom:22}}>
          {[[true,t("dark",lang)],[false,t("light",lang)]].map(([dark,label])=>(
            <button key={String(dark)} onClick={()=>{ if(isDark!==dark) toggleTheme(); }} style={{flex:1,background:isDark===dark?"#2563eb":T.surface,border:`1.5px solid ${isDark===dark?"#2563eb":T.border}`,borderRadius:10,padding:"11px",color:isDark===dark?"#fff":T.textMute,fontSize:fs(13,sc),fontWeight:isDark===dark?700:400,cursor:"pointer"}}>{label}</button>
          ))}
        </div>
        <div style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{t("fontSize",lang)}</div>
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          {[["small",t("small",lang),13],["normal",t("normal",lang),16],["large",t("large",lang),20]].map(([key,label,sz])=>(
            <button key={key} onClick={()=>setFontScale(key)} style={{flex:1,background:fontScale===key?"#2563eb":T.surface,border:`1.5px solid ${fontScale===key?"#2563eb":T.border}`,borderRadius:10,padding:"10px 6px",color:fontScale===key?"#fff":T.textMute,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:sz,fontWeight:800,color:fontScale===key?"#fff":T.text}}>A</div>
              <div style={{fontSize:10,marginTop:3,color:fontScale===key?"#ffffffaa":T.textMute}}>{label}</div>
            </button>
          ))}
        </div>
        <div style={{marginBottom:22,background:T.surface,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:fs(13,sc),color:T.text}}>{t("previewText",lang)}</div>
          <div style={{fontSize:fs(11,sc),color:T.textMute,marginTop:3}}>{t("previewSub",lang)}</div>
        </div>
        <div style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{t("features",lang)}</div>
        <div style={{background:T.surface,borderRadius:12,padding:"4px 14px",border:`1px solid ${incomeMode?"#22c55e44":T.border}`}}>
          <Toggle value={incomeMode} onChange={()=>setIncomeMode(p=>!p)} label={t("incomeMode",lang)} desc={t("incomeModeDesc",lang)} T={T} sc={sc}/>
        </div>
        {incomeMode&&<div style={{marginTop:8,background:isDarkBg(T.bg)?"#0d2b1a":"#f0fdf4",border:"1px solid #22c55e33",borderRadius:10,padding:"10px 14px",fontSize:fs(11,sc),color:"#16a34a"}}>{t("incomeModeOn",lang)}</div>}
        <div style={{marginTop:22,background:isDarkBg(T.bg)?"#0d2137":"#eff6ff",border:"1px solid #2563eb33",borderRadius:12,padding:"14px"}}>
          <div style={{fontSize:fs(12,sc),fontWeight:700,color:"#2563eb",marginBottom:8}}>{t("privacySec",lang)}</div>
          <div style={{fontSize:fs(11,sc),color:T.textMute,lineHeight:1.7}}>{TR.privacyLines[lang||"es"].map((l,i)=><div key={i}>• {l}</div>)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Panel ────────────────────────────────────────────────────────────
function ProfilePanel({ user, profile, onSaveProfile, onLogout, onOpenCards, cards, T, sc, lang, onClose }) {
  const [avatarId,setAvatarId] = useState(profile?.avatarId||"a1");
  const [saving,setSaving]     = useState(false);
  const handleSave = async () => { setSaving(true); await onSaveProfile({avatarId}); setSaving(false); onClose(); };
  return (
    <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.header,borderRadius:"20px 20px 0 0",padding:"20px 18px 40px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:fs(16,sc),fontWeight:800,color:T.text}}>👤 {user?.displayName||""}</div>
          <button onClick={onClose} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.textMute,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:fs(13,sc)}}>✕</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,background:T.surface,borderRadius:14,padding:"14px",marginBottom:18,border:`1px solid ${T.border}`}}>
          <AvatarBubble avatarId={avatarId} size={56} fontSize={28}/>
          <div>
            <div style={{fontSize:fs(15,sc),fontWeight:800,color:T.text}}>{user?.displayName}</div>
            {profile?.username&&<div style={{fontSize:fs(12,sc),color:"#3b82f6",fontWeight:600,marginTop:2}}>@{profile.username}</div>}
            <div style={{fontSize:fs(11,sc),color:T.textMute,marginTop:2}}>{user?.email}</div>
          </div>
        </div>
        <div style={{background:T.surface,borderRadius:14,padding:"14px",marginBottom:16,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:fs(12,sc),fontWeight:700,color:T.textMute,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{t("chooseAvatar",lang)}</div>
          <AvatarPicker current={avatarId} onChange={setAvatarId} T={T} sc={sc} lang={lang}/>
        </div>
        <button onClick={handleSave} disabled={saving} style={{width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:12,padding:"12px",fontSize:fs(14,sc),fontWeight:800,cursor:"pointer",marginBottom:10,opacity:saving?0.7:1}}>
          {saving?t("saving",lang):t("saveProfile",lang)}
        </button>
        <div style={{background:isDarkBg(T.bg)?"#0d2137":"#eff6ff",border:"1px solid #2563eb33",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:14}}>🔒</span>
          <div style={{fontSize:fs(11,sc),color:T.textMute}}>{t("dataPrivate",lang)} <b style={{color:"#2563eb"}}>{t("encrypted",lang)}</b> {t("andPrivate",lang)}</div>
        </div>
        <button onClick={()=>{onOpenCards();onClose();}} style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 14px",fontSize:fs(13,sc),fontWeight:600,cursor:"pointer",marginBottom:8}}>
          {t("manageCards2",lang)} ({cards.length})
        </button>
        <button onClick={onLogout} style={{width:"100%",background:"#ef444415",border:"1px solid #ef444430",color:"#ef4444",borderRadius:10,padding:"10px 14px",fontSize:fs(12,sc),fontWeight:700,cursor:"pointer"}}>
          {t("signOut",lang)}
        </button>
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ T, isDark, toggleTheme, sc, lang, setLang }) {
  const [mode,setMode]=useState("login"); const [emailOrUser,setEmailOrUser]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState(""); const [username,setUsername]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false); const [showPass,setShowPass]=useState(false); const [showPrivacy,setShowPrivacy]=useState(false);
  const inp = {width:"100%",background:T.inputBg,border:`1.5px solid ${T.border2}`,color:T.text,borderRadius:10,padding:"12px 14px",fontSize:fs(15,sc),marginBottom:12,boxSizing:"border-box",outline:"none"};
  const errMap = (code) => ({
    "auth/email-already-in-use":t("errEmailUsed",lang),"auth/invalid-credential":t("errCreds",lang),
    "auth/wrong-password":t("errCreds",lang),"auth/user-not-found":t("errCreds",lang),
    "auth/invalid-email":t("errInvalidEmail",lang),"auth/weak-password":t("errWeakPass",lang),
    "auth/network-request-failed":t("errNetwork",lang),
  }[code]||t("errGeneric",lang));
  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="register") {
        if(!name.trim()){setError(t("errName",lang));setLoading(false);return;}
        if(!validUsername(username)){setError(t("errUsername",lang));setLoading(false);return;}
        if(!emailOrUser.trim()||!password.trim()){setError(t("errFields",lang));setLoading(false);return;}
        const uSnap = await getDoc(doc(db,"usernames",username.toLowerCase()));
        if(uSnap.exists()){setError(t("errUserTaken",lang));setLoading(false);return;}
        const cred = await createUserWithEmailAndPassword(auth,emailOrUser,password);
        await updateProfile(cred.user,{displayName:name.trim()});
        await setDoc(doc(db,"usernames",username.toLowerCase()),{uid:cred.user.uid,email:emailOrUser.toLowerCase()});
        await setDoc(doc(db,`users/${cred.user.uid}/profile/main`),{username:username.toLowerCase(),displayName:name.trim(),avatarId:"a1",lang,createdAt:new Date().toISOString()});
      } else {
        if(!emailOrUser.trim()||!password.trim()){setError(t("errFields",lang));setLoading(false);return;}
        let emailToUse = emailOrUser.trim();
        if(!emailToUse.includes("@")){
          const uSnap = await getDoc(doc(db,"usernames",emailToUse.toLowerCase()));
          if(!uSnap.exists()){setError(t("errUserNotFound",lang));setLoading(false);return;}
          emailToUse = uSnap.data().email;
        }
        await signInWithEmailAndPassword(auth,emailToUse,password);
      }
    } catch(e){ setError(errMap(e.code)); }
    setLoading(false);
  };
  return (
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div style={{position:"fixed",top:12,right:12,display:"flex",gap:6}}>
        {Object.entries(LANGS).map(([code])=>(
          <button key={code} onClick={()=>setLang(code)} style={{background:lang===code?"#2563eb":T.surface,border:`1px solid ${lang===code?"#2563eb":T.border}`,borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:13,color:lang===code?"#fff":T.textMute}}>
            {code==="es"?"🇲🇽":code==="en"?"🇺🇸":"🇨🇳"}
          </button>
        ))}
        <button onClick={toggleTheme} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:13}}>{isDark?"☀️":"🌙"}</button>
      </div>
      <div style={{fontSize:fs(28,sc),fontWeight:900,color:T.text,marginBottom:4,letterSpacing:-1}}>MoneyTrack</div>
      <div style={{fontSize:fs(13,sc),color:T.textMute,marginBottom:28}}>{t("appTagline",lang)}</div>
      <div style={{width:"100%",maxWidth:400,background:T.surface,borderRadius:20,padding:"26px 22px",border:`1px solid ${T.border}`,boxShadow:isDark?"0 8px 40px #00000060":"0 8px 40px #00000015"}}>
        <div style={{display:"flex",background:T.bg,borderRadius:10,padding:4,marginBottom:22}}>
          {[["login",t("signIn",lang)],["register",t("signUp",lang)]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,background:mode===m?"#2563eb":"none",border:"none",borderRadius:7,padding:"9px",color:mode===m?"#fff":T.textMute,fontSize:fs(13,sc),fontWeight:mode===m?700:400,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        {mode==="register"&&<>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("yourName",lang)} style={inp}/>
          <input value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g,""))} placeholder={t("username",lang)} style={{...inp,marginBottom:4}}/>
          <div style={{fontSize:fs(10,sc),color:T.textDim,marginBottom:12}}>{t("usernameTip",lang)}</div>
        </>}
        <input type={mode==="login"?"text":"email"} value={emailOrUser} onChange={e=>setEmailOrUser(e.target.value)} placeholder={mode==="login"?t("emailOrUser",lang):t("email",lang)} style={inp} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        <div style={{position:"relative",marginBottom:4}}>
          <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={t("password",lang)} style={{...inp,marginBottom:0,paddingRight:44}} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.textMute}}>{showPass?"🙈":"👁️"}</button>
        </div>
        {error&&<div style={{fontSize:fs(12,sc),color:"#ef4444",marginTop:8,marginBottom:4}}>⚠️ {error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:12,padding:"14px",fontSize:fs(15,sc),fontWeight:800,cursor:"pointer",marginTop:14,opacity:loading?0.7:1,boxShadow:"0 4px 20px #2563eb40"}}>
          {loading?t("loading",lang):(mode==="login"?t("enter",lang):t("signUp",lang))}
        </button>
        <button onClick={()=>setShowPrivacy(p=>!p)} style={{width:"100%",background:"none",border:"none",color:"#2563eb",fontSize:fs(12,sc),marginTop:14,cursor:"pointer",textAlign:"center"}}>
          🔒 {showPrivacy?t("hidePrivacy",lang):t("howPrivate",lang)}
        </button>
        {showPrivacy&&<div style={{marginTop:8,background:isDark?"#0d2137":"#eff6ff",border:"1px solid #2563eb33",borderRadius:10,padding:"12px 14px",fontSize:fs(11,sc),color:T.textMute,lineHeight:1.6,whiteSpace:"pre-line"}}>{t("privacyBlock",lang)}</div>}
      </div>
      <div style={{marginTop:16,fontSize:fs(11,sc),color:T.textDim,textAlign:"center"}}>{t("syncedCloud",lang)}</div>
    </div>
  );
}

// ─── Income Dashboard ─────────────────────────────────────────────────────────
function IncomeDashboard({ expenses, incomes, currentWeek, T, sc, isDark, lang }) {
  const wEnd    = weekEnd(currentWeek);
  const weekExp = expenses.filter(e=>e.date>=currentWeek&&e.date<=wEnd&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0);
  const weekInc = incomes.filter(i=>i.date>=currentWeek&&i.date<=wEnd&&i.currency!=="USD").reduce((s,i)=>s+i.amount,0);
  const balance = weekInc - weekExp;
  const savingsRate = weekInc>0?((balance/weekInc)*100):0;
  const now = new Date(); const M = MONTHS_SHORT[lang]||MONTHS_SHORT.es;
  const monthsData = Array.from({length:6},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()-i,1); const mk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; const inc=incomes.filter(x=>monthKey(x.date)===mk&&x.currency!=="USD").reduce((s,x)=>s+x.amount,0); const exp=expenses.filter(x=>monthKey(x.date)===mk&&x.currency!=="USD").reduce((s,x)=>s+x.amount,0); return {label:M[d.getMonth()],ingresos:inc,gastos:exp,balance:inc-exp}; }).reverse();
  const weeksData = Array.from({length:6},(_,i)=>{ const ws=addDays(weekStart(todayStr()),-(7*i)),we=weekEnd(ws); const inc=incomes.filter(x=>x.date>=ws&&x.date<=we&&x.currency!=="USD").reduce((s,x)=>s+x.amount,0); const exp=expenses.filter(x=>x.date>=ws&&x.date<=we&&x.currency!=="USD").reduce((s,x)=>s+x.amount,0); return {label:i===0?(lang==="zh"?"本周":lang==="en"?"Now":"Esta"):`S-${i}`,ingresos:inc,gastos:exp,balance:inc-exp}; }).reverse();
  const incBycat = INCOME_CATEGORIES.map(c=>({...c,total:incomes.filter(i=>i.category===c.id&&i.currency!=="USD").reduce((s,i)=>s+i.amount,0)})).filter(c=>c.total>0);
  const totalInc = incomes.filter(i=>i.currency!=="USD").reduce((s,i)=>s+i.amount,0);
  const totalExp = expenses.filter(e=>e.currency!=="USD").reduce((s,e)=>s+e.amount,0);
  const tooltipStyle = {background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:fs(11,sc),color:T.text};
  const incLabel = lang==="zh"?"收入":lang==="en"?"Income":"Ingresos";
  const expLabel = lang==="zh"?"支出":lang==="en"?"Expenses":"Gastos";
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <StatCard icon="📥" label={t("incomeWeek",lang)} value={fmtMXN(weekInc)} sub={t("thisWeek",lang)} color="#22c55e" T={T} sc={sc}/>
        <StatCard icon="📤" label={t("expWeek",lang)}    value={fmtMXN(weekExp)} sub={t("thisWeek",lang)} color="#ef4444" T={T} sc={sc}/>
        <StatCard icon="💎" label={t("balanceWeek",lang)} value={fmtMXN(balance)} sub={balance>=0?t("surplus",lang):t("deficit",lang)} color={balance>=0?"#22c55e":"#ef4444"} T={T} sc={sc}/>
        <StatCard icon="📊" label={t("savingsRate",lang)} value={`${savingsRate.toFixed(0)}%`} sub={t("ofIncome",lang)} color="#a855f7" T={T} sc={sc}/>
      </div>
      {[[ weeksData,t("last6Weeks",lang)],[monthsData,t("last6Months",lang)]].map(([data,title])=>(
        <div key={title} style={{background:T.surface,borderRadius:14,padding:14,marginBottom:16,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:12}}>{title}</div>
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={data} barSize={13} barGap={2}>
              <XAxis dataKey="label" tick={{fontSize:fs(9,sc),fill:T.textMute}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={tooltipStyle} formatter={(v,n)=>[fmtMXN(v),n==="ingresos"?incLabel:expLabel]} cursor={{fill:"#00000008"}}/>
              <Bar dataKey="ingresos" fill="#22c55e" radius={[4,4,0,0]}/>
              <Bar dataKey="gastos"   fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:6}}>
            {[["#22c55e",incLabel],["#ef4444",expLabel]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:fs(11,sc)}}><div style={{width:10,height:10,borderRadius:2,background:c}}/><span style={{color:T.textMute}}>{l}</span></div>))}
          </div>
        </div>
      ))}
      {monthsData.some(m=>m.balance!==0)&&(
        <div style={{background:T.surface,borderRadius:14,padding:14,marginBottom:16,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:12}}>{t("monthlyBalance",lang)}</div>
          <ResponsiveContainer width="100%" height={115}>
            <LineChart data={monthsData}>
              <XAxis dataKey="label" tick={{fontSize:fs(9,sc),fill:T.textMute}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={tooltipStyle} formatter={(v)=>[fmtMXN(v),"Balance"]} cursor={{stroke:T.border}}/>
              <Line type="monotone" dataKey="balance" stroke="#a855f7" strokeWidth={2} dot={{fill:"#a855f7",r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {incBycat.length>0&&(
        <div style={{background:T.surface,borderRadius:14,padding:14,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:12}}>{t("incomeSources",lang)}</div>
          {incBycat.sort((a,b)=>b.total-a.total).map(c=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:fs(17,sc),width:26,textAlign:"center"}}>{c.icon}</span><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:fs(13,sc),fontWeight:600,color:T.text}}>{catLabel(c,lang)}</span><span style={{fontSize:fs(13,sc),fontWeight:700,color:c.color}}>{fmtMXN(c.total)}</span></div><div style={{background:T.barEmpty,borderRadius:99,height:5}}><div style={{width:`${(c.total/totalInc)*100}%`,height:"100%",borderRadius:99,background:c.color}}/></div></div><span style={{fontSize:fs(10,sc),color:T.textMute,width:30,textAlign:"right"}}>{((c.total/totalInc)*100).toFixed(0)}%</span></div>))}
          <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,textAlign:"center"}}>
            {[[t("totalIncome",lang),fmtMXN(totalInc),"#22c55e"],[t("totalExpenses",lang),fmtMXN(totalExp),"#ef4444"],[t("totalBalance",lang),fmtMXN(totalInc-totalExp),(totalInc-totalExp)>=0?"#22c55e":"#ef4444"]].map(([lbl,val,col])=>(<div key={lbl}><div style={{fontSize:fs(10,sc),color:T.textMute}}>{lbl}</div><div style={{fontSize:fs(14,sc),fontWeight:800,color:col}}>{val}</div></div>))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Income ───────────────────────────────────────────────────────────────
function AddIncome({ onSave, onCancel, T, sc, lang }) {
  const [amount,setAmount]=useState(""); const [category,setCategory]=useState("sueldo"); const [currency,setCurrency]=useState("MXN"); const [note,setNote]=useState(""); const [date,setDate]=useState(todayStr()); const [saving,setSaving]=useState(false);
  const handleSave = async () => { const amt=parseFloat(amount); if(!amt||amt<=0)return; setSaving(true); await onSave({amount:amt,category,currency,note,date}); setSaving(false); };
  return (
    <div>
      <div style={{fontSize:fs(15,sc),fontWeight:800,marginBottom:16,color:T.text}}>{t("registerIncome",lang)}</div>
      <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>{t("amount",lang)}</label>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{flex:1,background:T.inputBg,border:`1px solid ${T.border2}`,color:T.text,borderRadius:10,padding:"12px 14px",fontSize:fs(24,sc),fontWeight:800,boxSizing:"border-box"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>{[["MXN","🇲🇽"],["USD","🇺🇸"]].map(([cur,flag])=>(<button key={cur} onClick={()=>setCurrency(cur)} style={{background:currency===cur?"#22c55e":T.surface,border:`1.5px solid ${currency===cur?"#22c55e":T.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:currency===cur?"#fff":T.textMute,fontSize:fs(13,sc),fontWeight:700}}>{flag} {cur}</button>))}</div>
      </div>
      <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:8}}>{t("source",lang)}</label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {INCOME_CATEGORIES.map(c=>(<button key={c.id} onClick={()=>setCategory(c.id)} style={{background:category===c.id?`${c.color}20`:T.surface,border:`1.5px solid ${category===c.id?c.color:T.border}`,borderRadius:10,padding:"10px 4px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:fs(20,sc)}}>{c.icon}</div><div style={{fontSize:fs(10,sc),color:category===c.id?c.color:T.textMute,marginTop:3,fontWeight:700}}>{catLabel(c,lang)}</div></button>))}
      </div>
      <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>{t("date",lang)}</label>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 14px",fontSize:fs(14,sc),marginBottom:14,boxSizing:"border-box"}}/>
      <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>{t("note",lang)}</label>
      <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder={t("noteIncPlaceholder",lang)} style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 14px",fontSize:fs(14,sc),marginBottom:20,boxSizing:"border-box"}}/>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",color:"#fff",borderRadius:12,padding:"14px",fontSize:fs(16,sc),fontWeight:800,cursor:"pointer",opacity:saving?0.7:1,boxShadow:"0 4px 24px #16a34a40",marginBottom:10}}>{saving?t("saving",lang):t("addIncome",lang)}</button>
      <button onClick={onCancel} style={{width:"100%",background:"none",border:`1px solid ${T.border}`,color:T.textMute,borderRadius:12,padding:"11px",fontSize:fs(14,sc),cursor:"pointer"}}>{t("cancel",lang)}</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark,setIsDark]             = useState(()=>lsGet("mt_theme",true));
  const [fontScale,setFontScaleRaw]    = useState(()=>lsGet("mt_fontscale","normal"));
  const [incomeMode,setIncomeModeRaw]  = useState(()=>lsGet("mt_incomemode",false));
  const [lang,setLangRaw]              = useState(()=>lsGet("mt_lang","es"));
  const [user,setUser]                 = useState(undefined);
  const [profile,setProfile]           = useState(null);
  const [expenses,setExpenses]         = useState([]);
  const [incomes,setIncomes]           = useState([]);
  const [cards,setCards]               = useState([]);
  const [goals,setGoals]               = useState([]);
  const [recurring,setRecurring]       = useState([]);
  const [weekBudget,setWeekBudget]     = useState(0);
  const [editBudget,setEditBudget]     = useState(false);
  const [budgetInput,setBudgetInput]   = useState("");
  const [view,setView]                 = useState("dashboard");
  const [form,setForm]                 = useState({amount:"",category:"comida",method:"efectivo",currency:"MXN",cardId:null,note:"",date:todayStr()});
  const [currentWeek,setCurrentWeek]   = useState(()=>weekStart(todayStr()));
  const [showProfile,setShowProfile]   = useState(false);
  const [showCardMgr,setShowCardMgr]   = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [showImporter,setShowImporter] = useState(false);
  const [showGoals,setShowGoals]       = useState(false);
  const [showRecurring,setShowRecurring] = useState(false);
  const [saving,setSaving]             = useState(false);
  const unsubRef                       = useRef([]);

  const T  = isDark ? DARK : LIGHT;
  const sc = FONT_SCALES[fontScale] || 1;

  const setFontScale  = (v) => { setFontScaleRaw(v); lsSet("mt_fontscale",v); };
  const setIncomeMode = (fn) => { setIncomeModeRaw(prev => { const next = typeof fn==="function"?fn(prev):fn; lsSet("mt_incomemode",next); return next; }); };
  const setLang       = (v) => { setLangRaw(v); lsSet("mt_lang",v); };
  const toggleTheme   = () => setIsDark(d => !d);

  useEffect(() => { const u = onAuthStateChanged(auth, u => setUser(u||null)); return () => u(); }, []);

  useEffect(() => {
    unsubRef.current.forEach(u => u());
    unsubRef.current = [];
    if (!user) { setExpenses([]); setIncomes([]); setCards([]); setGoals([]); setRecurring([]); setWeekBudget(0); setProfile(null); return; }
    const uid = user.uid;
    const s1 = onSnapshot(query(collection(db,`users/${uid}/expenses`),orderBy("date","desc")), s => setExpenses(s.docs.map(d=>({id:d.id,...d.data()}))));
    const s2 = onSnapshot(query(collection(db,`users/${uid}/incomes`), orderBy("date","desc")), s => setIncomes(s.docs.map(d=>({id:d.id,...d.data()}))));
    const s3 = onSnapshot(query(collection(db,`users/${uid}/cards`),   orderBy("createdAt","asc")), s => setCards(s.docs.map(d=>({id:d.id,...d.data()}))));
    const s4 = onSnapshot(query(collection(db,`users/${uid}/settings`)), s => { const d=s.docs.find(d=>d.id==="budget"); const b=d?.data()?.weekBudget||0; setWeekBudget(b); setBudgetInput(b?String(b):""); });
    const s5 = onSnapshot(doc(db,`users/${uid}/profile/main`), s => { if(s.exists()){ const p=s.data(); setProfile(p); if(p.lang) setLangRaw(p.lang); } });
    const s6 = onSnapshot(query(collection(db,`users/${uid}/goals`),     orderBy("createdAt","asc")), s => setGoals(s.docs.map(d=>({id:d.id,...d.data()}))));
    const s7 = onSnapshot(query(collection(db,`users/${uid}/recurring`), orderBy("createdAt","asc")), s => setRecurring(s.docs.map(d=>({id:d.id,...d.data()}))));
    unsubRef.current = [s1,s2,s3,s4,s5,s6,s7];
    return () => unsubRef.current.forEach(u => u());
  }, [user]);

  useEffect(() => lsSet("mt_theme",isDark), [isDark]);
  useEffect(() => { if(!incomeMode&&(view==="incomes"||view==="addIncome")) setView("dashboard"); }, [incomeMode]);

  // Process recurring expenses automatically
  useEffect(() => {
    if (!user || recurring.length===0) return;
    const uid = user.uid;
    const today = todayStr();
    recurring.forEach(async (r) => {
      if (!r.active || !r.nextDate || r.nextDate > today) return;
      const id = Date.now().toString() + Math.random().toString(36).slice(2);
      await setDoc(doc(db,`users/${uid}/expenses/${id}`),{amount:r.amount,category:r.category,method:"efectivo",currency:"MXN",cardId:null,note:r.name+" (recurrente)",date:r.nextDate,createdAt:new Date().toISOString()});
      const d = new Date(r.nextDate+"T12:00:00");
      if(r.frequency==="weekly") d.setDate(d.getDate()+7);
      else if(r.frequency==="biweekly") d.setDate(d.getDate()+14);
      else d.setMonth(d.getMonth()+1);
      await setDoc(doc(db,`users/${uid}/recurring/${r.id}`),{...r,nextDate:d.toISOString().slice(0,10)},{merge:true});
    });
  }, [recurring, user]);

  const uid = user?.uid;

  // Budget notification
  const weekTotalMXN = expenses.filter(e=>e.date>=currentWeek&&e.date<=weekEnd(currentWeek)&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0);
  useEffect(() => {
    if(!weekBudget||!weekTotalMXN) return;
    const pct = (weekTotalMXN/weekBudget)*100;
    const key = `mt_notif_${new Date().toISOString().slice(0,7)}`;
    const sent = localStorage.getItem(key)||"0";
    const send = (msg) => { if("Notification" in window && Notification.permission==="granted") new Notification("MoneyTrack",{body:msg,icon:"/icon-192.png"}); };
    if(pct>=100&&sent!=="100"){ send("🚨 ¡Presupuesto agotado esta semana!"); localStorage.setItem(key,"100"); }
    else if(pct>=80&&sent!=="80"&&sent!=="100"){ send(`⚠️ Llevas el ${pct.toFixed(0)}% de tu presupuesto semanal.`); localStorage.setItem(key,"80"); }
  }, [weekTotalMXN, weekBudget]);

  const addExpense    = async () => { const amount=parseFloat(form.amount); if(!amount||amount<=0)return; if(form.method==="tarjeta"&&!form.cardId){alert(t("noCards",lang));return;} setSaving(true); const id=Date.now().toString(); await setDoc(doc(db,`users/${uid}/expenses/${id}`),{amount,category:form.category,method:form.method,currency:form.method==="tarjeta"?"MXN":form.currency,cardId:form.cardId||null,note:form.note,date:form.date,createdAt:new Date().toISOString()}); setForm(f=>({...f,amount:"",note:""})); setView("dashboard"); setSaving(false); };
  const deleteExpense = async (id) => deleteDoc(doc(db,`users/${uid}/expenses/${id}`));
  const addIncomeFn   = async (data) => { const id=Date.now().toString(); await setDoc(doc(db,`users/${uid}/incomes/${id}`),{...data,createdAt:new Date().toISOString()}); setView("incomes"); };
  const deleteIncome  = async (id) => deleteDoc(doc(db,`users/${uid}/incomes/${id}`));
  const saveBudget    = async () => { const v=parseFloat(budgetInput); if(!(v>0))return; setWeekBudget(v); setEditBudget(false); await setDoc(doc(db,`users/${uid}/settings/budget`),{weekBudget:v}); };
  const addCard       = async (card) => setDoc(doc(db,`users/${uid}/cards/${card.id}`),{...card,createdAt:new Date().toISOString()});
  const deleteCard    = async (id) => { await deleteDoc(doc(db,`users/${uid}/cards/${id}`)); if(form.cardId===id) setForm(f=>({...f,cardId:cards.find(c=>c.id!==id)?.id||null})); };
  const handleLogout  = () => signOut(auth);
  const saveProfile   = async (data) => setDoc(doc(db,`users/${uid}/profile/main`),{...profile,...data,lang},{merge:true});
  const addGoal       = async (g) => { const id=Date.now().toString(); await setDoc(doc(db,`users/${uid}/goals/${id}`),{...g,id,saved:0}); };
  const deleteGoal    = async (id) => deleteDoc(doc(db,`users/${uid}/goals/${id}`));
  const addContrib    = async (id, amt) => { const g=goals.find(x=>x.id===id); if(!g)return; await setDoc(doc(db,`users/${uid}/goals/${id}`),{...g,saved:(g.saved||0)+amt},{merge:true}); };
  const addRecurring  = async (r) => { const id=Date.now().toString(); await setDoc(doc(db,`users/${uid}/recurring/${id}`),{...r,id}); };
  const deleteRecurring = async (id) => deleteDoc(doc(db,`users/${uid}/recurring/${id}`));
  const toggleRecurring = async (id, active) => { const r=recurring.find(x=>x.id===id); if(!r)return; await setDoc(doc(db,`users/${uid}/recurring/${id}`),{...r,active},{merge:true}); };
  const handleCSVImport = async (rows) => {
    for (const row of rows) {
      const id = Date.now().toString()+Math.random().toString(36).slice(2);
      if(row.type==="income") { await setDoc(doc(db,`users/${uid}/incomes/${id}`),{amount:row.amount,category:row.category||"sueldo",currency:"MXN",note:row.desc||"",date:row.date,createdAt:new Date().toISOString()}); }
      else { await setDoc(doc(db,`users/${uid}/expenses/${id}`),{amount:row.amount,category:row.category||"otros",method:"efectivo",currency:"MXN",cardId:null,note:row.desc||"",date:row.date,createdAt:new Date().toISOString()}); }
    }
  };
  const requestNotif = async () => { if("Notification" in window) await Notification.requestPermission(); };

  // Derived data
  const thisWeek = weekStart(todayStr());
  const wEnd     = weekEnd(currentWeek);
  const filtered = expenses.filter(e => e.date>=currentWeek&&e.date<=wEnd);
  const totalMXN = filtered.filter(e=>e.currency!=="USD").reduce((s,e)=>s+e.amount,0);
  const totalUSD = filtered.filter(e=>e.currency==="USD").reduce((s,e)=>s+e.amount,0);
  const remaining = weekBudget - totalMXN;
  const pct = weekBudget>0?Math.min((totalMXN/weekBudget)*100,100):0;
  const isCurrentWeek = currentWeek === thisWeek;
  const totalHistInc = incomes.filter(i=>i.currency!=="USD").reduce((s,i)=>s+i.amount,0);
  const totalHistExp = expenses.filter(e=>e.currency!=="USD").reduce((s,e)=>s+e.amount,0);

  const byCategory = CATEGORIES.map(c=>({...c,total:filtered.filter(e=>e.category===c.id&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0),totalUSD:filtered.filter(e=>e.category===c.id&&e.currency==="USD").reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0||c.totalUSD>0);
  const dailyData  = Array.from({length:7},(_,i)=>{ const d=addDays(currentWeek,i); return {day:(DAYS_SHORT[lang]||DAYS_SHORT.es)[new Date(d+"T12:00:00").getDay()],total:expenses.filter(e=>e.date===d&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0),date:d}; });

  const analyticsData = (() => {
    const weeks = Array.from({length:8},(_,i)=>{ const ws=addDays(thisWeek,-(7*i)),we=weekEnd(ws); return {label:fmtWeekLabel(ws,lang),isCurrent:i===0,total:expenses.filter(e=>e.date>=ws&&e.date<=we&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0)}; }).reverse();
    const wwd = weeks.filter(w=>w.total>0);
    const now = new Date();
    const mS = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
    const mE = new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().slice(0,10);
    const monthTotal = expenses.filter(e=>e.date>=mS&&e.date<=mE&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0);
    return {
      chartWeeks: weeks.slice(-5).map((w,i)=>({label:i===4?(lang==="zh"?"本周":lang==="en"?"Now":"Esta"):`S-${4-i}`,total:w.total,isCurrent:w.isCurrent})),
      avgWeek: wwd.length>0?wwd.reduce((s,w)=>s+w.total,0)/wwd.length:0,
      bestWeek: wwd.length>0?wwd.reduce((a,b)=>a.total<b.total?a:b):null,
      monthTotal,
      avgDay: now.getDate()>0?monthTotal/now.getDate():0,
    };
  })();

  const cat  = (id) => CATEGORIES.find(c=>c.id===id)||CATEGORIES[6];
  const icat = (id) => INCOME_CATEGORIES.find(c=>c.id===id)||INCOME_CATEGORIES[5];
  const card = (id) => cards.find(c=>c.id===id)||null;
  const tooltipStyle = {background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:fs(11,sc),color:T.text};

  const navTabs = [
    ["dashboard","📊",t("week",lang)],
    ["analysis","📈",t("analysis",lang)],
    ...(incomeMode?[["incomes","💰",t("incomes",lang)]]:[]),
    ["add","➕",t("add",lang)],
    ["history","📋",t("history",lang)],
    ["extras","✨","Extras"],
  ];

  if (user===undefined) return (
    <div style={{background:DARK.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:24,fontWeight:900,color:"#f1f5f9",letterSpacing:-1}}>MoneyTrack</div>
      <div style={{color:"#475569",fontSize:14}}>{t("loading","es")}</div>
    </div>
  );
  if (!user) return <AuthScreen T={T} isDark={isDark} toggleTheme={toggleTheme} sc={sc} lang={lang} setLang={setLang}/>;

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:T.bg,minHeight:"100vh",color:T.text,maxWidth:480,margin:"0 auto",paddingBottom:90,transition:"background 0.3s",fontSize:fs(14,sc)}}>
      {showCardMgr  && <CardManager cards={cards} onAdd={addCard} onDelete={deleteCard} onClose={()=>setShowCardMgr(false)} T={T} sc={sc} lang={lang}/>}
      {showSettings && <SettingsPanel isDark={isDark} toggleTheme={toggleTheme} fontScale={fontScale} setFontScale={setFontScale} incomeMode={incomeMode} setIncomeMode={setIncomeMode} lang={lang} setLang={setLang} T={T} sc={sc} onClose={()=>setShowSettings(false)}/>}
      {showProfile  && <ProfilePanel user={user} profile={profile} onSaveProfile={saveProfile} onLogout={handleLogout} onOpenCards={()=>setShowCardMgr(true)} cards={cards} T={T} sc={sc} lang={lang} onClose={()=>setShowProfile(false)}/>}
      {showImporter && <CSVImporter onImport={handleCSVImport} onClose={()=>setShowImporter(false)} T={T} sc={sc} lang={lang}/>}
      {showGoals    && <GoalsPanel goals={goals} onAdd={addGoal} onDelete={deleteGoal} onAddContribution={addContrib} balance={totalHistInc-totalHistExp} T={T} sc={sc} lang={lang} onClose={()=>setShowGoals(false)}/>}
      {showRecurring && <RecurringPanel recurring={recurring} onAdd={addRecurring} onDelete={deleteRecurring} onToggle={toggleRecurring} T={T} sc={sc} lang={lang} onClose={()=>setShowRecurring(false)}/>}

      {/* HEADER */}
      <div style={{background:T.header,padding:"14px 16px",borderBottom:`1px solid ${T.border}`,boxShadow:isDark?"none":"0 1px 8px #00000010"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:(view==="analysis"||view==="incomes"||view==="extras")?0:10}}>
          <div style={{fontSize:fs(20,sc),fontWeight:900,color:T.text,letterSpacing:-0.5}}>MoneyTrack</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {view!=="analysis"&&view!=="incomes"&&view!=="extras"&&(<>
              <button onClick={()=>setCurrentWeek(addDays(currentWeek,-7))} style={{background:T.surface,border:`1px solid ${T.border2}`,color:T.textMute,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
              <div style={{textAlign:"center",minWidth:90}}>
                <div style={{fontSize:fs(10,sc),fontWeight:700,color:isCurrentWeek?"#3b82f6":T.textMute}}>{isCurrentWeek?t("thisWeek",lang):t("week",lang)}</div>
                <div style={{fontSize:fs(9,sc),color:T.textMute}}>{fmtWeekLabel(currentWeek,lang)}</div>
              </div>
              <button onClick={()=>{if(!isCurrentWeek)setCurrentWeek(addDays(currentWeek,7));}} style={{background:T.surface,border:`1px solid ${isCurrentWeek?T.border:T.border2}`,color:isCurrentWeek?T.border:T.textMute,borderRadius:8,width:30,height:30,cursor:isCurrentWeek?"default":"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            </>)}
            <button onClick={()=>setShowSettings(true)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
            <div onClick={()=>setShowProfile(p=>!p)} style={{cursor:"pointer"}}><AvatarBubble avatarId={profile?.avatarId||"a1"} size={32} fontSize={16}/></div>
          </div>
        </div>

        {view!=="analysis"&&view!=="incomes"&&view!=="extras"&&(editBudget?(
          <div style={{display:"flex",gap:8}}>
            <input type="number" value={budgetInput} onChange={e=>setBudgetInput(e.target.value)} placeholder={`${t("budget",lang)} (MXN)`} autoFocus style={{flex:1,background:T.inputBg,border:"1px solid #3b82f6",color:T.text,borderRadius:8,padding:"8px 12px",fontSize:fs(14,sc)}} onKeyDown={e=>e.key==="Enter"&&saveBudget()}/>
            <button onClick={saveBudget} style={{background:"#2563eb",border:"none",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:700,fontSize:fs(13,sc)}}>OK</button>
            <button onClick={()=>setEditBudget(false)} style={{background:T.surface,border:`1px solid ${T.border2}`,color:T.textMute,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:fs(13,sc)}}>✕</button>
          </div>
        ):(
          <div onClick={()=>setEditBudget(true)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:fs(12,sc),color:T.textMute}}>{t("budget",lang)}:</span>
            <span style={{fontSize:fs(14,sc),fontWeight:700,color:weekBudget>0?T.text:T.textMute}}>{weekBudget>0?fmtMXN(weekBudget):t("configHere",lang)}</span>
            <span style={{fontSize:11,color:"#3b82f6"}}>✏️</span>
          </div>
        ))}

        {view!=="analysis"&&view!=="incomes"&&view!=="extras"&&weekBudget>0&&(
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:fs(12,sc),color:T.textMute}}>{t("spent",lang)}: <b style={{color:T.text}}>{fmtMXN(totalMXN)}</b></span>
              <span style={{fontSize:fs(12,sc),fontWeight:700,color:remaining>=0?"#22c55e":"#ef4444"}}>{remaining>=0?`${t("remaining",lang)} ${fmtMXN(remaining)}`:`⚠️ ${t("exceeded",lang)} ${fmtMXN(Math.abs(remaining))}`}</span>
            </div>
            <div style={{background:T.barEmpty,borderRadius:99,height:8,overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",borderRadius:99,transition:"width 0.5s",background:pct<60?"linear-gradient(90deg,#22c55e,#16a34a)":pct<85?"linear-gradient(90deg,#eab308,#ca8a04)":"linear-gradient(90deg,#ef4444,#dc2626)"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <span style={{fontSize:fs(10,sc),color:T.textDim}}>{pct.toFixed(0)}{t("used",lang)}</span>
              {totalUSD>0&&<span style={{fontSize:fs(10,sc),color:"#22c55e"}}>+ {fmtUSD(totalUSD)} USD</span>}
            </div>
          </div>
        )}
      </div>

      {/* NAV */}
      <div style={{display:"flex",background:T.header,borderBottom:`1px solid ${T.border}`,overflowX:"auto"}}>
        {navTabs.map(([v,ico,label])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,minWidth:52,background:"none",border:"none",padding:"9px 4px",color:view===v?"#3b82f6":T.textMute,fontSize:fs(11,sc),fontWeight:view===v?700:400,cursor:"pointer",borderBottom:view===v?"2px solid #3b82f6":"2px solid transparent",whiteSpace:"nowrap"}}>
            {ico}<br/><span style={{fontSize:fs(9,sc)}}>{label}</span>
          </button>
        ))}
      </div>

      <div style={{padding:"16px"}}>

        {/* SEMANA */}
        {view==="dashboard"&&(filtered.length===0?(
          <div style={{textAlign:"center",padding:"50px 0",color:T.textMute}}>
            <div style={{fontSize:44}}>📭</div>
            <div style={{marginTop:12,fontSize:fs(15,sc)}}>{t("noExpenses",lang)}</div>
            <div style={{marginTop:6,fontSize:fs(13,sc)}}>{t("tapAdd",lang)}</div>
          </div>
        ):(
          <>
            <div style={{background:T.surface,borderRadius:14,padding:14,marginBottom:16,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:10}}>{t("expByDay",lang)}</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={dailyData} barSize={22}>
                  <XAxis dataKey="day" tick={{fontSize:fs(11,sc),fill:T.textMute}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v)=>[fmtMXN(v),t("spent",lang)]} cursor={{fill:"#00000008"}}/>
                  <Bar dataKey="total" radius={[5,5,0,0]}>{dailyData.map((d,i)=><Cell key={i} fill={d.date===todayStr()?"#2563eb":d.total>0?isDark?"#2563eb77":"#93c5fd":T.barEmpty}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:10}}>{t("byCategory",lang)}</div>
              {byCategory.sort((a,b)=>(b.total+b.totalUSD)-(a.total+a.totalUSD)).map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                  <span style={{fontSize:fs(17,sc),width:26,textAlign:"center"}}>{c.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:fs(13,sc),fontWeight:600,color:T.text}}>{catLabel(c,lang)}</span>
                      <span style={{fontSize:fs(12,sc),fontWeight:700,color:c.color}}>{c.total>0&&fmtMXN(c.total)}{c.total>0&&c.totalUSD>0&&" + "}{c.totalUSD>0&&fmtUSD(c.totalUSD)}</span>
                    </div>
                    <div style={{background:T.barEmpty,borderRadius:99,height:5}}><div style={{width:`${totalMXN>0?(c.total/totalMXN)*100:0}%`,height:"100%",borderRadius:99,background:c.color}}/></div>
                  </div>
                </div>
              ))}
            </div>
            {byCategory.filter(c=>c.total>0).length>0&&(
              <div style={{background:T.surface,borderRadius:14,padding:14,marginBottom:16,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:6}}>{t("distributionMXN",lang)}</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={byCategory.filter(c=>c.total>0)} dataKey="total" cx="50%" cy="50%" outerRadius={58} stroke={T.bg} strokeWidth={2}>{byCategory.filter(c=>c.total>0).map(c=><Cell key={c.id} fill={c.color}/>)}</Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v)=>[fmtMXN(v)]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",justifyContent:"center"}}>
                  {byCategory.filter(c=>c.total>0).map(c=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:fs(11,sc)}}><div style={{width:7,height:7,borderRadius:2,background:c.color}}/><span style={{color:T.textMute}}>{catLabel(c,lang)}</span></div>))}
                </div>
              </div>
            )}
            <div style={{background:T.surface,borderRadius:14,padding:14,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:12}}>{t("cashVsCard",lang)}</div>
              {(()=>{ const ef=filtered.filter(e=>e.method==="efectivo"&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0),efUSD=filtered.filter(e=>e.method==="efectivo"&&e.currency==="USD").reduce((s,e)=>s+e.amount,0); return (ef>0||efUSD>0)&&(<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{fontSize:fs(20,sc),width:26}}>💵</div><div style={{flex:1}}><div style={{fontSize:fs(13,sc),fontWeight:600,color:T.text}}>{t("cash",lang)}</div><div style={{fontSize:fs(12,sc),color:T.textMute}}>{ef>0&&fmtMXN(ef)}{ef>0&&efUSD>0&&" · "}{efUSD>0&&fmtUSD(efUSD)+" USD"}</div></div></div>); })()}
              {cards.map(c=>{ const tot=filtered.filter(e=>e.cardId===c.id).reduce((s,e)=>s+e.amount,0); if(!tot)return null; return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{width:32,height:20,borderRadius:4,background:`linear-gradient(135deg,${c.color},${c.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(11,sc),flexShrink:0}}>💳</div><div style={{flex:1}}><div style={{fontSize:fs(13,sc),fontWeight:600,color:c.color}}>{c.name}</div>{c.last4&&<div style={{fontSize:fs(10,sc),color:T.textMute}}>**** {c.last4}</div>}</div><div style={{fontSize:fs(13,sc),fontWeight:700,color:c.color}}>{fmtMXN(tot)}</div></div>); })}
            </div>
          </>
        ))}

        {/* ANÁLISIS */}
        {view==="analysis"&&(expenses.length===0?<div style={{textAlign:"center",padding:"50px 0",color:T.textMute}}><div style={{fontSize:44}}>📊</div><div style={{marginTop:12,fontSize:fs(15,sc)}}>{t("noData",lang)}</div></div>:(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <StatCard icon="📅" label={t("thisMonth",lang)} value={fmtMXN(analyticsData.monthTotal)} sub={`${new Date().getDate()} ${t("days",lang)}`} color="#3b82f6" T={T} sc={sc}/>
              <StatCard icon="📆" label={t("avgDay",lang)} value={fmtMXN(analyticsData.avgDay)} sub={t("currentMonth",lang)} color="#a855f7" T={T} sc={sc}/>
              <StatCard icon="📉" label={t("bestWeek",lang)} value={analyticsData.bestWeek?fmtMXN(analyticsData.bestWeek.total):"—"} sub={analyticsData.bestWeek?.label||t("noDataShort",lang)} color="#22c55e" T={T} sc={sc}/>
              <StatCard icon="📈" label={t("avgWeek",lang)} value={analyticsData.avgWeek>0?fmtMXN(analyticsData.avgWeek):"—"} sub={t("historical",lang)} color="#eab308" T={T} sc={sc}/>
            </div>
            <div style={{background:T.surface,borderRadius:14,padding:14,marginBottom:16,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:10}}>{t("last5Weeks",lang)}</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={analyticsData.chartWeeks} barSize={28}>
                  <XAxis dataKey="label" tick={{fontSize:fs(10,sc),fill:T.textMute}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v)=>[fmtMXN(v),t("spent",lang)]} cursor={{fill:"#00000008"}}/>
                  <Bar dataKey="total" radius={[5,5,0,0]}>{analyticsData.chartWeeks.map((w,i)=><Cell key={i} fill={w.isCurrent?"#2563eb":w.total>0?isDark?"#2563eb66":"#93c5fd":T.barEmpty}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.surface,borderRadius:14,padding:14,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:fs(11,sc),letterSpacing:2,color:T.textMute,textTransform:"uppercase",marginBottom:12}}>{t("catHistorical",lang)}</div>
              {CATEGORIES.map(c=>{ const tot=expenses.filter(e=>e.category===c.id&&e.currency!=="USD").reduce((s,e)=>s+e.amount,0); if(!tot)return null; const all=expenses.filter(e=>e.currency!=="USD").reduce((s,e)=>s+e.amount,0); return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}><span style={{fontSize:fs(16,sc),width:22}}>{c.icon}</span><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:fs(13,sc),fontWeight:600,color:T.text}}>{catLabel(c,lang)}</span><span style={{fontSize:fs(13,sc),fontWeight:700,color:c.color}}>{fmtMXN(tot)}</span></div><div style={{background:T.barEmpty,borderRadius:99,height:4}}><div style={{width:`${(tot/all)*100}%`,height:"100%",borderRadius:99,background:c.color}}/></div></div><span style={{fontSize:fs(11,sc),color:T.textMute,width:30,textAlign:"right"}}>{((tot/all)*100).toFixed(0)}%</span></div>); })}
            </div>
          </>
        ))}

        {/* INGRESOS */}
        {view==="incomes"&&<IncomeDashboard expenses={expenses} incomes={incomes} currentWeek={currentWeek} T={T} sc={sc} isDark={isDark} lang={lang}/>}

        {/* AGREGAR GASTO */}
        {view==="add"&&(
          <div>
            {incomeMode&&(<div style={{display:"flex",background:T.surface,borderRadius:10,padding:4,marginBottom:18,border:`1px solid ${T.border}`}}>
              <button onClick={()=>setView("add")} style={{flex:1,background:"#2563eb",border:"none",borderRadius:7,padding:"9px",color:"#fff",fontSize:fs(13,sc),fontWeight:700,cursor:"pointer"}}>{t("expenseTab",lang)}</button>
              <button onClick={()=>setView("addIncome")} style={{flex:1,background:"none",border:"none",borderRadius:7,padding:"9px",color:T.textMute,fontSize:fs(13,sc),fontWeight:400,cursor:"pointer"}}>{t("incomeTab",lang)}</button>
            </div>)}
            <div style={{fontSize:fs(15,sc),fontWeight:800,marginBottom:16,color:T.text}}>{t("registerExpense",lang)}</div>
            <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>{t("amount",lang)}</label>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input type="number" inputMode="decimal" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" style={{flex:1,background:T.inputBg,border:`1px solid ${T.border2}`,color:T.text,borderRadius:10,padding:"12px 14px",fontSize:fs(24,sc),fontWeight:800,boxSizing:"border-box"}}/>
              {form.method==="efectivo"&&(<div style={{display:"flex",flexDirection:"column",gap:6}}>{[["MXN","🇲🇽"],["USD","🇺🇸"]].map(([cur,flag])=>(<button key={cur} onClick={()=>setForm(f=>({...f,currency:cur}))} style={{background:form.currency===cur?"#2563eb":T.surface,border:`1.5px solid ${form.currency===cur?"#2563eb":T.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:form.currency===cur?"#fff":T.textMute,fontSize:fs(13,sc),fontWeight:700}}>{flag} {cur}</button>))}</div>)}
            </div>
            <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:7}}>{t("category",lang)}</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:14}}>
              {CATEGORIES.map(c=>(<button key={c.id} onClick={()=>setForm(f=>({...f,category:c.id}))} style={{background:form.category===c.id?`${c.color}20`:T.surface,border:`1.5px solid ${form.category===c.id?c.color:T.border}`,borderRadius:10,padding:"9px 4px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:fs(19,sc)}}>{c.icon}</div><div style={{fontSize:fs(9,sc),color:form.category===c.id?c.color:T.textMute,marginTop:3,fontWeight:700}}>{catLabel(c,lang)}</div></button>))}
            </div>
            <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:7}}>{t("method",lang)}</label>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[["efectivo","💵 "+t("cash",lang)],["tarjeta","💳 "+t("card",lang)]].map(([v,label])=>(<button key={v} onClick={()=>setForm(f=>({...f,method:v,cardId:v==="tarjeta"?(cards[0]?.id||null):null,currency:v==="tarjeta"?"MXN":f.currency}))} style={{flex:1,background:form.method===v?isDark?"#172038":"#eff6ff":T.surface,border:`1.5px solid ${form.method===v?"#3b82f6":T.border}`,borderRadius:10,padding:"11px",color:form.method===v?"#2563eb":T.textMute,fontWeight:form.method===v?700:400,fontSize:fs(14,sc),cursor:"pointer"}}>{label}</button>))}
            </div>
            {form.method==="tarjeta"&&(<div style={{marginBottom:14}}>{cards.length===0?(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px",textAlign:"center"}}><div style={{fontSize:fs(13,sc),color:T.textMute,marginBottom:10}}>{t("noCards",lang)}</div><button onClick={()=>setShowCardMgr(true)} style={{background:"#2563eb",border:"none",color:"#fff",borderRadius:8,padding:"9px 18px",fontSize:fs(13,sc),fontWeight:700,cursor:"pointer"}}>{t("addCard",lang)}</button></div>):(<>{cards.map(c=><CardChip key={c.id} card={c} selected={form.cardId===c.id} onClick={()=>setForm(f=>({...f,cardId:c.id}))} T={T} sc={sc}/>)}<button onClick={()=>setShowCardMgr(true)} style={{background:"none",border:`1px dashed ${T.border2}`,color:T.textMute,borderRadius:10,padding:"9px",width:"100%",cursor:"pointer",fontSize:fs(12,sc),marginTop:2}}>{t("manageCards",lang)}</button></>)}</div>)}
            <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>{t("date",lang)}</label>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 14px",fontSize:fs(14,sc),marginBottom:14,boxSizing:"border-box"}}/>
            <label style={{fontSize:fs(11,sc),color:T.textMute,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>{t("note",lang)}</label>
            <input type="text" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder={t("noteExpPlaceholder",lang)} style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"10px 14px",fontSize:fs(14,sc),marginBottom:20,boxSizing:"border-box"}}/>
            <button onClick={addExpense} disabled={saving} style={{width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",borderRadius:12,padding:"14px",fontSize:fs(16,sc),fontWeight:800,cursor:"pointer",opacity:saving?0.7:1,boxShadow:"0 4px 24px #2563eb40"}}>{saving?t("saving",lang):t("addExpense",lang)}</button>
          </div>
        )}

        {/* AGREGAR INGRESO */}
        {view==="addIncome"&&(
          <div>
            <div style={{display:"flex",background:T.surface,borderRadius:10,padding:4,marginBottom:18,border:`1px solid ${T.border}`}}>
              <button onClick={()=>setView("add")} style={{flex:1,background:"none",border:"none",borderRadius:7,padding:"9px",color:T.textMute,fontSize:fs(13,sc),fontWeight:400,cursor:"pointer"}}>{t("expenseTab",lang)}</button>
              <button onClick={()=>setView("addIncome")} style={{flex:1,background:"#22c55e",border:"none",borderRadius:7,padding:"9px",color:"#fff",fontSize:fs(13,sc),fontWeight:700,cursor:"pointer"}}>{t("incomeTab",lang)}</button>
            </div>
            <AddIncome onSave={addIncomeFn} onCancel={()=>setView("dashboard")} T={T} sc={sc} lang={lang}/>
          </div>
        )}

        {/* HISTORIAL */}
        {view==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:fs(15,sc),fontWeight:800,color:T.text}}>{t("historyTitle",lang)}</div>
              <button onClick={()=>setShowImporter(true)} style={{background:"#2563eb",border:"none",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:fs(11,sc),fontWeight:700,cursor:"pointer"}}>📂 CSV</button>
            </div>
            {filtered.length===0?(<div style={{textAlign:"center",padding:"50px 0",color:T.textMute}}><div style={{fontSize:40}}>📭</div><div style={{marginTop:12,fontSize:fs(14,sc)}}>{t("noExpWeek",lang)}</div></div>):(
              (()=>{
                const byDay={};
                filtered.forEach(e=>{if(!byDay[e.date])byDay[e.date]=[];byDay[e.date].push(e);});
                const DF=DAYS_FULL[lang]||DAYS_FULL.es;
                return Object.keys(byDay).sort().reverse().map(date=>{
                  const dayTotal=byDay[date].filter(e=>e.currency!=="USD").reduce((s,e)=>s+e.amount,0),dayUSD=byDay[date].filter(e=>e.currency==="USD").reduce((s,e)=>s+e.amount,0);
                  const d=new Date(date+"T12:00:00"),isToday=date===todayStr();
                  return(<div key={date} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                      <span style={{fontSize:fs(12,sc),fontWeight:700,color:isToday?"#2563eb":T.textMute}}>{isToday?t("todayPrefix",lang):""}{DF[d.getDay()]}, {d.getDate()}</span>
                      <span style={{fontSize:fs(12,sc),color:T.textMute}}>{dayTotal>0&&fmtMXN(dayTotal)}{dayTotal>0&&dayUSD>0&&" + "}{dayUSD>0&&fmtUSD(dayUSD)}</span>
                    </div>
                    {byDay[date].map(e=>{ const c=cat(e.category),cd=e.cardId?card(e.cardId):null; return(
                      <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,borderRadius:11,padding:"10px 12px",marginBottom:6,border:`1px solid ${T.border}`}}>
                        <div style={{width:34,height:34,borderRadius:9,background:`${c.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(16,sc),flexShrink:0}}>{c.icon}</div>
                        <div style={{flex:1,minWidth:0}}><div style={{fontSize:fs(13,sc),fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.note||catLabel(c,lang)}</div><div style={{fontSize:fs(11,sc),color:T.textDim,marginTop:1}}>{e.method==="tarjeta"&&cd?<span style={{color:cd.color,fontWeight:600}}>💳 {cd.name}</span>:<span>💵 {t("cash",lang)}{e.currency==="USD"&&<span style={{color:"#22c55e",fontWeight:700}}> · USD</span>}</span>}</div></div>
                        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:fs(14,sc),fontWeight:700,color:c.color}}>{fmtAmt(e.amount,e.currency||"MXN")}</div><button onClick={()=>deleteExpense(e.id)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:fs(11,sc),padding:0,marginTop:1}}>{t("delete",lang)}</button></div>
                      </div>
                    ); })}
                  </div>);
                });
              })()
            )}
            {incomeMode&&(()=>{ const wI=incomes.filter(i=>i.date>=currentWeek&&i.date<=wEnd); if(!wI.length)return null; return(<div style={{marginTop:8}}><div style={{fontSize:fs(12,sc),fontWeight:700,color:"#22c55e",marginBottom:10}}>{t("incomesWeek",lang)}</div>{wI.map(i=>{ const c=icat(i.category); return(<div key={i.id} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,borderRadius:11,padding:"10px 12px",marginBottom:6,border:"1px solid #22c55e22"}}><div style={{width:34,height:34,borderRadius:9,background:`${c.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(16,sc),flexShrink:0}}>{c.icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:fs(13,sc),fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.note||catLabel(c,lang)}</div><div style={{fontSize:fs(11,sc),color:T.textDim,marginTop:1}}>{i.date}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:fs(14,sc),fontWeight:700,color:"#22c55e"}}>+{fmtAmt(i.amount,i.currency||"MXN")}</div><button onClick={()=>deleteIncome(i.id)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:fs(11,sc),padding:0,marginTop:1}}>{t("delete",lang)}</button></div></div>); })}</div>); })()}
          </div>
        )}

        {/* EXTRAS */}
        {view==="extras"&&(
          <div>
            <div style={{fontSize:fs(15,sc),fontWeight:800,color:T.text,marginBottom:18}}>✨ Extras</div>

            {"Notification" in window && Notification.permission!=="granted"&&(
              <div style={{background:"#1d4ed822",border:"1px solid #2563eb44",borderRadius:14,padding:"14px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:24,flexShrink:0}}>🔔</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:fs(13,sc),fontWeight:700,color:T.text}}>Activar notificaciones</div>
                  <div style={{fontSize:fs(11,sc),color:T.textMute,marginTop:2}}>Te avisamos al 80% y 100% del presupuesto</div>
                </div>
                <button onClick={requestNotif} style={{background:"#2563eb",border:"none",color:"#fff",borderRadius:9,padding:"8px 14px",fontSize:fs(12,sc),fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Activar</button>
              </div>
            )}
            {"Notification" in window && Notification.permission==="granted"&&(
              <div style={{background:isDark?"#0d2b1a":"#f0fdf4",border:"1px solid #22c55e33",borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:20}}>✅</span>
                <div style={{fontSize:fs(12,sc),color:"#22c55e",fontWeight:600}}>Notificaciones de presupuesto activas</div>
              </div>
            )}

            {[
              {icon:"🎯",label:"Metas de Ahorro",    desc:`${goals.length} metas · Balance ${fmtMXN(totalHistInc-totalHistExp)}`,color:"#2563eb",action:()=>setShowGoals(true)},
              {icon:"🔁",label:"Gastos Recurrentes",  desc:`${recurring.filter(r=>r.active).length} activos`,color:"#7c3aed",action:()=>setShowRecurring(true)},
              {icon:"📂",label:"Importar CSV banco",  desc:"Importa movimientos automáticamente",color:"#059669",action:()=>setShowImporter(true)},
            ].map(item=>(
              <button key={item.label} onClick={item.action} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px",marginBottom:12,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:46,height:46,borderRadius:13,background:`${item.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{item.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:fs(14,sc),fontWeight:700,color:T.text}}>{item.label}</div>
                  <div style={{fontSize:fs(11,sc),color:T.textMute,marginTop:3}}>{item.desc}</div>
                </div>
                <div style={{fontSize:18,color:T.textMute}}>›</div>
              </button>
            ))}

            <ExchangeWidget T={T} sc={sc} lang={lang}/>
          </div>
        )}
      </div>

      {view!=="add"&&view!=="addIncome"&&(
        <button onClick={()=>setView("add")} style={{position:"fixed",bottom:22,right:22,width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 4px 22px #2563eb55",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      )}
    </div>
  );
}
