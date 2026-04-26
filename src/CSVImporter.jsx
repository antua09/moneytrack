import { useState, useRef } from "react";

// ─── Bank format detectors ────────────────────────────────────────────────────
const BANK_FORMATS = {
  bbva: {
    name: "BBVA",
    color: "#004481",
    detect: (headers) => headers.some(h => /fecha/i.test(h)) && headers.some(h => /cargo/i.test(h)) && headers.some(h => /abono/i.test(h)),
    dateCol:   (h) => h.find(x => /fecha.*operaci/i.test(x) || /^fecha$/i.test(x)),
    descCol:   (h) => h.find(x => /concepto|descripci/i.test(x)),
    amountCol: (h) => h.find(x => /cargo/i.test(x)),
    incomeCol: (h) => h.find(x => /abono/i.test(x)),
  },
  banorte: {
    name: "Banorte",
    color: "#e30613",
    detect: (headers) => headers.some(h => /fecha/i.test(h)) && headers.some(h => /importe/i.test(h)),
    dateCol:   (h) => h.find(x => /fecha/i.test(x)),
    descCol:   (h) => h.find(x => /descripci|concepto|referencia/i.test(x)),
    amountCol: (h) => h.find(x => /importe|monto/i.test(x)),
    incomeCol: () => null,
  },
  santander: {
    name: "Santander",
    color: "#cc0000",
    detect: (headers) => headers.some(h => /fecha/i.test(h)) && headers.some(h => /retiro/i.test(h)) && headers.some(h => /dep.sito/i.test(h)),
    dateCol:   (h) => h.find(x => /fecha/i.test(x)),
    descCol:   (h) => h.find(x => /concepto|descripci|movimiento/i.test(x)),
    amountCol: (h) => h.find(x => /retiro|cargo/i.test(x)),
    incomeCol: (h) => h.find(x => /dep.sito|abono/i.test(x)),
  },
  citibanamex: {
    name: "Citibanamex",
    color: "#003087",
    detect: (headers) => headers.some(h => /fecha/i.test(h)) && headers.some(h => /descripci/i.test(h)) && headers.some(h => /importe|monto/i.test(h)),
    dateCol:   (h) => h.find(x => /fecha/i.test(x)),
    descCol:   (h) => h.find(x => /descripci/i.test(x)),
    amountCol: (h) => h.find(x => /importe|monto|retiro/i.test(x)),
    incomeCol: (h) => h.find(x => /abono|dep.sito/i.test(x)),
  },
  hsbc: {
    name: "HSBC",
    color: "#db0011",
    detect: (headers) => headers.some(h => /date/i.test(h)) && headers.some(h => /debit|withdraw/i.test(h)),
    dateCol:   (h) => h.find(x => /date/i.test(x)),
    descCol:   (h) => h.find(x => /description|detail/i.test(x)),
    amountCol: (h) => h.find(x => /debit|withdraw|amount/i.test(x)),
    incomeCol: (h) => h.find(x => /credit|deposit/i.test(x)),
  },
};

// ─── Auto-categorization by keyword ──────────────────────────────────────────
const KEYWORD_RULES = [
  { cat:"comida",          kw:/oxxo|walmart|soriana|chedraui|super|mercado|restaur|pizza|burger|starbucks|mcdonald|kfc|sushi|taco|fonda|cocina|cafeter|domino|subway/i },
  { cat:"transporte",      kw:/uber|didi|cabify|gasolina|pemex|estacion|parking|estacionam|caseta|autobus|metro|taxi|combustible/i },
  { cat:"entretenimiento", kw:/netflix|spotify|amazon prime|disney|cinema|cinepolis|cinemex|cine|teatro|concierto|steam|xbox|playstation/i },
  { cat:"ropa",            kw:/zara|h&m|liverpool|palacio|suburbia|ropa|calzado|zapater|flexi/i },
  { cat:"servicios",       kw:/telmex|telcel|att|movistar|izzi|megacable|totalplay|cfe|agua|gas|internet|telefon|electricidad/i },
  { cat:"salud",           kw:/farmacia|benavides|similares|hospital|clinica|medico|doctor|dental|optica|laboratorio/i },
];

const autoCat = (desc) => {
  if (!desc) return "otros";
  for (const rule of KEYWORD_RULES) {
    if (rule.kw.test(desc)) return rule.cat;
  }
  return "otros";
};

// ─── CSV parser ───────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Try comma, then semicolon, then tab
  const delimiters = [",", ";", "\t", "|"];
  let delimiter = ",";
  for (const d of delimiters) {
    if (lines[0].split(d).length > 2) { delimiter = d; break; }
  }

  const splitLine = (line) => {
    const result = [];
    let current = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === delimiter && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += line[i]; }
    }
    result.push(current.trim());
    return result;
  };

  // Skip non-header rows at the top (some banks add metadata)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cols = splitLine(lines[i]);
    if (cols.length >= 3 && cols.some(c => /fecha|date|dia/i.test(c))) { headerIdx = i; break; }
  }

  const headers = splitLine(lines[headerIdx]).map(h => h.replace(/^["']|["']$/g, "").trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 2 || cols.every(c => !c.trim())) continue;
    const row = {};
    headers.forEach((h, j) => { row[h] = (cols[j] || "").replace(/^["']|["']$/g, "").trim(); });
    rows.push(row);
  }
  return { headers, rows };
};

// Clean amount string → number
const cleanAmount = (str) => {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.\-,]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.abs(n);
};

// Parse date → YYYY-MM-DD
const parseDate = (str) => {
  if (!str) return null;
  // DD/MM/YYYY or DD-MM-YYYY
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`; }
  // YYYY-MM-DD
  m = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  // MM/DD/YYYY
  m = str.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
  return null;
};

const CATS = ["comida","transporte","entretenimiento","ropa","servicios","salud","otros"];
const CAT_ICONS = {comida:"🍔",transporte:"🚌",entretenimiento:"🎮",ropa:"👕",servicios:"💡",salud:"💊",otros:"📦"};
const CAT_COLORS = {comida:"#f97316",transporte:"#3b82f6",entretenimiento:"#a855f7",ropa:"#ec4899",servicios:"#eab308",salud:"#22c55e",otros:"#64748b"};

// ─── Main component ───────────────────────────────────────────────────────────
export default function CSVImporter({ onImport, onClose, T, sc, lang }) {
  const [step, setStep]           = useState("upload");   // upload | preview | done
  const [parsed, setParsed]       = useState(null);
  const [bank, setBank]           = useState(null);
  const [mapping, setMapping]     = useState({});
  const [rows, setRows]           = useState([]);         // enriched rows
  const [selected, setSelected]   = useState([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef();

  const fs = (b, s) => `${Math.round(b * (s || sc))}px`;

  // ── Step 1: file load ──────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.match(/\.(csv|txt|xls)$/i)) { setError("Sube un archivo CSV o TXT."); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows: rawRows } = parseCSV(text);
      if (headers.length < 2) { setError("No se pudo leer el archivo. Verifica que sea un CSV válido."); return; }

      // Detect bank
      let detectedBank = null;
      for (const [key, fmt] of Object.entries(BANK_FORMATS)) {
        if (fmt.detect(headers)) { detectedBank = { key, ...fmt }; break; }
      }

      // Build initial mapping
      const initMapping = {
        date:   detectedBank?.dateCol(headers)   || "",
        desc:   detectedBank?.descCol(headers)   || "",
        amount: detectedBank?.amountCol(headers) || "",
        income: detectedBank?.incomeCol(headers) || "",
      };

      setParsed({ headers, rawRows });
      setBank(detectedBank);
      setMapping(initMapping);
      setStep("map");
    };
    reader.readAsText(file, "latin1");
  };

  // ── Step 2: map & preview ──────────────────────────────────────────────────
  const buildPreview = () => {
    if (!mapping.date || !mapping.amount) { setError("Selecciona al menos Fecha y Monto."); return; }
    setError("");
    const enriched = [];
    for (const row of parsed.rawRows) {
      const date   = parseDate(row[mapping.date]);
      const amount = cleanAmount(row[mapping.amount]);
      const incAmt = mapping.income ? cleanAmount(row[mapping.income]) : 0;
      const desc   = row[mapping.desc] || "";

      // Skip rows with no valid date or zero amounts
      if (!date) continue;

      if (amount > 0) {
        enriched.push({ id: Date.now() + Math.random(), date, amount, desc, category: autoCat(desc), type: "expense", selected: true });
      }
      if (incAmt > 0) {
        enriched.push({ id: Date.now() + Math.random(), date, amount: incAmt, desc, category: "sueldo", type: "income", selected: true });
      }
    }

    if (enriched.length === 0) { setError("No se encontraron transacciones válidas. Revisa el mapeo de columnas."); return; }
    setRows(enriched);
    setSelected(enriched.map(r => r.id));
    setStep("preview");
  };

  // ── Step 3: import ─────────────────────────────────────────────────────────
  const handleImport = async () => {
    const toImport = rows.filter(r => selected.includes(r.id));
    if (toImport.length === 0) return;
    setImporting(true);
    await onImport(toImport);
    setImportedCount(toImport.length);
    setImporting(false);
    setStep("done");
  };

  const toggleRow = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === rows.length ? [] : rows.map(r => r.id));
  const updateCat = (id, cat) => setRows(prev => prev.map(r => r.id === id ? {...r, category: cat} : r));

  const inp = { background: T.inputBg, border: `1px solid ${T.border2}`, color: T.text, borderRadius: 8, padding: "8px 12px", fontSize: fs(13), outline: "none", width: "100%", boxSizing: "border-box" };
  const expRows = rows.filter(r => r.type === "expense");
  const incRows = rows.filter(r => r.type === "income");
  const selExp  = expRows.filter(r => selected.includes(r.id)).length;
  const selInc  = incRows.filter(r => selected.includes(r.id)).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 0" }}>
      <div style={{ background: T.header, borderRadius: 20, padding: "22px 18px 32px", width: "100%", maxWidth: 480, margin: "auto", border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: fs(17), fontWeight: 800, color: T.text }}>📂 Importar CSV</div>
            <div style={{ fontSize: fs(11), color: T.textMute, marginTop: 2 }}>
              {step === "upload" && "Sube tu estado de cuenta"}
              {step === "map"    && `${bank ? `Banco detectado: ${bank.name}` : "Banco no detectado — mapea las columnas"}`}
              {step === "preview"&& `${rows.length} transacciones encontradas`}
              {step === "done"   && "¡Importación completa!"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMute, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: fs(13) }}>✕</button>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[["upload","1. Subir"],["map","2. Columnas"],["preview","3. Revisar"],["done","4. Listo"]].map(([s, label]) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: ["upload","map","preview","done"].indexOf(step) >= ["upload","map","preview","done"].indexOf(s) ? "#2563eb" : T.barEmpty, transition: "background 0.3s" }}/>
          ))}
        </div>

        {/* ── UPLOAD ── */}
        {step === "upload" && (
          <div>
            {/* Bank logos */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {Object.values(BANK_FORMATS).map(b => (
                <div key={b.name} style={{ background: b.color + "22", border: `1px solid ${b.color}44`, borderRadius: 8, padding: "5px 10px", fontSize: fs(12), color: b.color, fontWeight: 700 }}>{b.name}</div>
              ))}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", fontSize: fs(12), color: T.textMute }}>+ otros</div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#2563eb" : T.border2}`, borderRadius: 16, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? "#2563eb10" : T.surface, transition: "all 0.2s", marginBottom: 16 }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: fs(14), fontWeight: 700, color: T.text, marginBottom: 6 }}>Arrastra tu archivo aquí</div>
              <div style={{ fontSize: fs(12), color: T.textMute, marginBottom: 14 }}>o toca para seleccionar</div>
              <div style={{ display: "inline-block", background: "#2563eb", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: fs(13), fontWeight: 700 }}>Seleccionar archivo</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            {error && <div style={{ fontSize: fs(12), color: "#ef4444", marginBottom: 10 }}>⚠️ {error}</div>}

            {/* How to export guide */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: fs(12), fontWeight: 700, color: T.text, marginBottom: 10 }}>¿Cómo exportar de tu banco?</div>
              {[
                ["BBVA", "App BBVA → Mis productos → Cuenta → Movimientos → Descargar"],
                ["Banorte", "Banca en línea → Consultas → Movimientos → Exportar CSV"],
                ["Santander", "SuperMóvil → Cuenta → Movimientos → Descargar Excel/CSV"],
                ["Citibanamex", "Citibanamex en línea → Consulta de movimientos → Exportar"],
              ].map(([banco, steps]) => (
                <div key={banco} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: fs(12), fontWeight: 700, color: "#2563eb" }}>{banco}: </span>
                  <span style={{ fontSize: fs(11), color: T.textMute }}>{steps}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAP COLUMNS ── */}
        {step === "map" && parsed && (
          <div>
            {bank && (
              <div style={{ background: bank.color + "18", border: `1px solid ${bank.color}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <div style={{ fontSize: fs(13), fontWeight: 700, color: bank.color }}>{bank.name} detectado</div>
                  <div style={{ fontSize: fs(11), color: T.textMute }}>Columnas pre-seleccionadas automáticamente</div>
                </div>
              </div>
            )}

            <div style={{ fontSize: fs(11), color: T.textMute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Mapeo de columnas</div>

            {[
              ["date",   "📅 Columna de Fecha *",   true ],
              ["desc",   "📝 Columna de Descripción",false],
              ["amount", "💸 Columna de Cargos/Gastos *",true ],
              ["income", "📥 Columna de Abonos/Ingresos (opcional)", false],
            ].map(([key, label, required]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: fs(12), color: T.textMute, marginBottom:5 }}>{label}</div>
                <select value={mapping[key] || ""} onChange={e => setMapping(m => ({...m, [key]: e.target.value}))}
                  style={{ ...inp, appearance: "none" }}>
                  <option value="">— No usar —</option>
                  {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}

            {/* Sample preview */}
            {parsed.rawRows.length > 0 && mapping.date && (
              <div style={{ background: T.surface, borderRadius: 10, padding: 12, border: `1px solid ${T.border}`, marginBottom: 16, overflowX: "auto" }}>
                <div style={{ fontSize: fs(11), color: T.textMute, marginBottom: 8 }}>Vista previa (primera fila)</div>
                <div style={{ fontSize: fs(11), color: T.text }}>
                  {mapping.date   && <div>📅 <b>Fecha:</b> {parsed.rawRows[0][mapping.date]}</div>}
                  {mapping.desc   && <div>📝 <b>Desc:</b> {parsed.rawRows[0][mapping.desc]}</div>}
                  {mapping.amount && <div>💸 <b>Cargo:</b> {parsed.rawRows[0][mapping.amount]}</div>}
                  {mapping.income && <div>📥 <b>Abono:</b> {parsed.rawRows[0][mapping.income]}</div>}
                </div>
              </div>
            )}

            {error && <div style={{ fontSize: fs(12), color: "#ef4444", marginBottom: 10 }}>⚠️ {error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setStep("upload"); setError(""); }} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, color: T.textMute, borderRadius: 10, padding: "11px", fontSize: fs(14), cursor: "pointer" }}>← Atrás</button>
              <button onClick={buildPreview} style={{ flex: 2, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "#fff", borderRadius: 10, padding: "11px", fontSize: fs(14), fontWeight: 700, cursor: "pointer" }}>Ver transacciones →</button>
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {step === "preview" && (
          <div>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                [`${rows.length}`, "Total", T.text],
                [`${selExp}`, "Gastos sel.", "#ef4444"],
                [`${selInc}`, "Ingresos sel.", "#22c55e"],
              ].map(([val, label, color]) => (
                <div key={label} style={{ background: T.surface, borderRadius: 10, padding: "10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: fs(18), fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: fs(10), color: T.textMute }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Select all */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: fs(12), color: T.textMute }}>{selected.length} de {rows.length} seleccionados</div>
              <button onClick={toggleAll} style={{ background: "none", border: `1px solid ${T.border}`, color: "#2563eb", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: fs(12), fontWeight: 600 }}>
                {selected.length === rows.length ? "Deselect. todo" : "Select. todo"}
              </button>
            </div>

            {/* Rows list */}
            <div style={{ maxHeight: 340, overflowY: "auto", marginBottom: 16 }}>
              {rows.map(row => {
                const isSel = selected.includes(row.id);
                const color = row.type === "income" ? "#22c55e" : CAT_COLORS[row.category] || "#64748b";
                return (
                  <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 8, background: isSel ? T.surface : T.bg, borderRadius: 10, padding: "9px 10px", marginBottom: 6, border: `1px solid ${isSel ? T.border : "transparent"}`, opacity: isSel ? 1 : 0.45, transition: "all 0.15s" }}>
                    {/* Checkbox */}
                    <div onClick={() => toggleRow(row.id)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSel ? "#2563eb" : T.border2}`, background: isSel ? "#2563eb" : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      {isSel && <div style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</div>}
                    </div>

                    {/* Type icon */}
                    <div style={{ fontSize: 16, flexShrink: 0 }}>{row.type === "income" ? "📥" : CAT_ICONS[row.category]}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: fs(12), fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.desc || "Sin descripción"}</div>
                      <div style={{ fontSize: fs(10), color: T.textMute }}>{row.date}</div>
                    </div>

                    {/* Category select (only for expenses) */}
                    {row.type === "expense" && (
                      <select value={row.category} onChange={e => updateCat(row.id, e.target.value)}
                        style={{ background: `${CAT_COLORS[row.category]}22`, border: `1px solid ${CAT_COLORS[row.category]}66`, color: CAT_COLORS[row.category], borderRadius: 6, padding: "2px 4px", fontSize: fs(10), cursor: "pointer", maxWidth: 76 }}>
                        {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                      </select>
                    )}

                    {/* Amount */}
                    <div style={{ fontSize: fs(13), fontWeight: 700, color, flexShrink: 0 }}>
                      {row.type === "income" ? "+" : "-"}${row.amount.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <div style={{ fontSize: fs(12), color: "#ef4444", marginBottom: 10 }}>⚠️ {error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("map")} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, color: T.textMute, borderRadius: 10, padding: "11px", fontSize: fs(14), cursor: "pointer" }}>← Atrás</button>
              <button onClick={handleImport} disabled={importing || selected.length === 0}
                style={{ flex: 2, background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "#fff", borderRadius: 10, padding: "11px", fontSize: fs(14), fontWeight: 700, cursor: "pointer", opacity: (importing || selected.length === 0) ? 0.6 : 1 }}>
                {importing ? "Importando..." : `📥 Importar ${selected.length} movimientos`}
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: fs(20), fontWeight: 800, color: T.text, marginBottom: 8 }}>¡Listo!</div>
            <div style={{ fontSize: fs(14), color: T.textMute, marginBottom: 24 }}>Se importaron <b style={{ color: "#22c55e" }}>{importedCount}</b> movimientos correctamente.</div>
            <button onClick={onClose} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "#fff", borderRadius: 12, padding: "12px 32px", fontSize: fs(15), fontWeight: 700, cursor: "pointer" }}>Ver mis movimientos</button>
          </div>
        )}
      </div>
    </div>
  );
}
