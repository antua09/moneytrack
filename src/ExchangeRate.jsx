import { useState, useEffect } from "react";

// Uses frankfurter.app — free, no API key needed
const API = "https://api.frankfurter.app/latest?from=USD&to=MXN";

export function useExchangeRate() {
  const [rate, setRate]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError]     = useState(null);

  const fetchRate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      const r = data.rates?.MXN;
      if (r) {
        setRate(r);
        setLastFetch(new Date());
        // Cache in localStorage
        localStorage.setItem("mt_exchange", JSON.stringify({ rate: r, ts: Date.now() }));
      }
    } catch (e) {
      setError("Sin conexión");
      // Try cache
      try {
        const cached = JSON.parse(localStorage.getItem("mt_exchange") || "null");
        if (cached && Date.now() - cached.ts < 86400000) { // 24h
          setRate(cached.rate);
          setLastFetch(new Date(cached.ts));
        }
      } catch {}
    }
    setLoading(false);
  };

  useEffect(() => {
    // Try cache first
    try {
      const cached = JSON.parse(localStorage.getItem("mt_exchange") || "null");
      if (cached && Date.now() - cached.ts < 3600000) { // 1h cache
        setRate(cached.rate);
        setLastFetch(new Date(cached.ts));
        return;
      }
    } catch {}
    fetchRate();
  }, []);

  return { rate, loading, error, lastFetch, refresh: fetchRate };
}

const fmtMXN = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:2}).format(n);
const fmtUSD = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
const fs = (b,s) => `${Math.round(b*s)}px`;

export function ExchangeWidget({ T, sc, lang }) {
  const { rate, loading, error, lastFetch, refresh } = useExchangeRate();
  const [usdInput, setUsdInput] = useState("");
  const [mxnInput, setMxnInput] = useState("");

  const handleUSD = (v) => { setUsdInput(v); if (rate && v) setMxnInput((parseFloat(v) * rate).toFixed(2)); else setMxnInput(""); };
  const handleMXN = (v) => { setMxnInput(v); if (rate && v) setUsdInput((parseFloat(v) / rate).toFixed(2)); else setUsdInput(""); };

  const timeAgo = () => {
    if (!lastFetch) return "";
    const mins = Math.floor((Date.now() - lastFetch) / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `hace ${mins} min`;
    return `hace ${Math.floor(mins/60)}h`;
  };

  const inp = { background: T.inputBg, border: `1px solid ${T.border2}`, color: T.text, borderRadius: 9, padding: "10px 12px", fontSize: fs(16,sc), fontWeight: 700, outline: "none", boxSizing: "border-box", width: "100%" };

  return (
    <div style={{ background: T.surface, borderRadius: 16, padding: 16, border: `1px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: fs(11,sc), color: T.textMute, letterSpacing: 1, textTransform: "uppercase" }}>💱 Tipo de Cambio</div>
          {rate && <div style={{ fontSize: fs(18,sc), fontWeight: 800, color: "#22c55e", marginTop: 2 }}>1 USD = {fmtMXN(rate)}</div>}
          {loading && <div style={{ fontSize: fs(13,sc), color: T.textMute }}>Actualizando...</div>}
          {error && !rate && <div style={{ fontSize: fs(12,sc), color: "#eab308" }}>⚠️ {error}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          {lastFetch && <div style={{ fontSize: fs(10,sc), color: T.textDim, marginBottom: 4 }}>{timeAgo()}</div>}
          <button onClick={refresh} disabled={loading} style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textMute, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: fs(12,sc) }}>
            {loading ? "⏳" : "🔄 Actualizar"}
          </button>
        </div>
      </div>

      {/* Converter */}
      {rate && (
        <div>
          <div style={{ fontSize: fs(11,sc), color: T.textMute, marginBottom: 8 }}>Conversor rápido</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: fs(10,sc), color: "#22c55e", marginBottom: 4 }}>🇺🇸 USD</div>
              <input type="number" inputMode="decimal" value={usdInput} onChange={e=>handleUSD(e.target.value)} placeholder="0.00" style={inp}/>
            </div>
            <div style={{ fontSize: 20, color: T.textMute, marginTop: 16 }}>⇄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: fs(10,sc), color: "#f97316", marginBottom: 4 }}>🇲🇽 MXN</div>
              <input type="number" inputMode="decimal" value={mxnInput} onChange={e=>handleMXN(e.target.value)} placeholder="0.00" style={inp}/>
            </div>
          </div>
          {usdInput && mxnInput && (
            <div style={{ marginTop: 10, textAlign: "center", fontSize: fs(11,sc), color: T.textMute }}>
              {fmtUSD(parseFloat(usdInput)||0)} = {fmtMXN(parseFloat(mxnInput)||0)}
            </div>
          )}
          <div style={{ marginTop: 12, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: fs(11,sc), color: T.textMute, marginBottom: 6 }}>Referencias rápidas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[10,50,100].map(usd => (
                <div key={usd} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: fs(11,sc), color: T.textDim }}>${usd} USD</div>
                  <div style={{ fontSize: fs(12,sc), fontWeight: 700, color: T.text }}>{fmtMXN(usd*rate)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
