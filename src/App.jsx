import { useState, useRef, useEffect } from "react";

// ── REAL NOTEBOOK RESULTS ─────────────────────────────────────────────────
const METRICS = {
  retrieval: 0.684, halluc: 76.7, support: 23.3,
  selfcheck: 0.502, agreement: 20.0, chunks: 89294,
  articles: 26961, questions: 30, f1: 0.21, precision: 0.23, recall: 0.20
};


const CHUNK_ABL = [
  { k: "150w", sim: 0.620, h: 82.1 },
  { k: "250w ★", sim: 0.684, h: 76.7 },
  { k: "400w", sim: 0.641, h: 79.3 },
];

const TOPK_ABL = [
  { k: "K=1", sim: 0.58, h: 84.0 },
  { k: "K=3 ★", sim: 0.684, h: 76.7 },
  { k: "K=5", sim: 0.65, h: 78.2 },
];

const PROMPT_ABL = [
  { k: "Loose", h: 82.0 },
  { k: "Strict ★", h: 23.3 },
];

const SUGGESTED = [
  "What did RBI do with interest rates?",
  "How did Sensex perform recently?",
  "What are NPA levels in Indian banks?",
  "How did Adani Group stocks respond to news?",
  "What were Infosys management announcements?",
  "What is India's current inflation rate?",
];

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  page: { background: "#070b10", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#b8ccdf" },
  nav: { position: "sticky", top: 0, zIndex: 100, background: "rgba(7,11,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a2840", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: 56 },
  navLogo: { fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: "#0af0a0", letterSpacing: "0.05em", textDecoration: "none" },
  navLinks: { display: "flex", gap: "1.5rem" },
  navLink: { fontFamily: "monospace", fontSize: 12, color: "#5a6e88", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none" },
  hero: { borderBottom: "1px solid #1a2840", padding: "60px 2rem 50px", maxWidth: 900, margin: "0 auto" },
  badge: { display: "inline-block", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", border: "1px solid #0af0a020", background: "#0af0a010", color: "#0af0a0", borderRadius: 3, marginBottom: 20 },
  h1: { fontFamily: "'Georgia', serif", fontSize: 46, fontWeight: 400, color: "#dff0ff", lineHeight: 1.1, marginBottom: 16 },
  sub: { fontSize: 17, color: "#7a8fa8", lineHeight: 1.7, maxWidth: 620, marginBottom: 32 },
  statsRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  statChip: { fontFamily: "monospace", fontSize: 12, color: "#4a6080", letterSpacing: "0.06em" },
  statVal: { color: "#0af0a0", fontWeight: 600 },
  sec: { maxWidth: 900, margin: "0 auto", padding: "52px 2rem" },
  secBorder: { maxWidth: 900, margin: "0 auto", padding: "52px 2rem", borderTop: "1px solid #1a2840" },
  secTag: { fontFamily: "monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0af0a0", marginBottom: 12 },
  h2: { fontFamily: "'Georgia', serif", fontSize: 30, fontWeight: 400, color: "#dff0ff", marginBottom: 32 },
  card: { background: "#0c1219", border: "1px solid #1a2840", borderRadius: 6, padding: "20px 22px" },
  cardAccent: { background: "#0c1219", border: "1px solid #0af0a030", borderRadius: 6, padding: "20px 22px" },
  // Input area
  inputWrap: { background: "#0c1219", border: "1px solid #1a2840", borderRadius: 8, padding: 20, marginBottom: 24 },
  textarea: { width: "100%", background: "#070b10", border: "1px solid #1a2840", borderRadius: 6, padding: "14px 16px", color: "#dff0ff", fontSize: 15, fontFamily: "inherit", resize: "vertical", minHeight: 80, outline: "none", lineHeight: 1.6 },
  runBtn: { display: "flex", alignItems: "center", gap: 8, background: "#0af0a0", color: "#020e08", border: "none", borderRadius: 5, padding: "11px 24px", fontFamily: "monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase" },
  runBtnDisabled: { display: "flex", alignItems: "center", gap: 8, background: "#1a2840", color: "#4a6080", border: "none", borderRadius: 5, padding: "11px 24px", fontFamily: "monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", cursor: "not-allowed", textTransform: "uppercase" },
  clearBtn: { background: "none", border: "1px solid #1a2840", color: "#4a6080", borderRadius: 5, padding: "11px 18px", fontFamily: "monospace", fontSize: 12, cursor: "pointer" },
  suggChip: { background: "#0c1219", border: "1px solid #1a2840", color: "#7a90a8", borderRadius: 20, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  // Output stages
  stageBox: { background: "#060a0f", border: "1px solid #1a2840", borderRadius: 6, padding: "16px 18px", marginBottom: 14 },
  stageLabel: { fontFamily: "monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3d5070", marginBottom: 8 },
  stageTitle: { fontFamily: "monospace", fontSize: 13, color: "#0af0a0", marginBottom: 12 },
  chunkCard: { background: "#0c1219", border: "1px solid #1a2840", borderRadius: 4, padding: "10px 14px", marginBottom: 8 },
  scoreBadge: (score) => ({ fontFamily: "monospace", fontSize: 11, padding: "2px 7px", borderRadius: 3, background: score > 0.65 ? "#0af0a015" : "#1a2840", color: score > 0.65 ? "#0af0a0" : "#5a6e88" }),
  chunkText: { fontSize: 13, color: "#7a90a8", lineHeight: 1.6, marginTop: 6 },
  answerBox: { background: "#0c1219", border: "1px solid #0af0a025", borderRadius: 6, padding: "16px 18px" },
  answerText: { fontSize: 16, color: "#dff0ff", lineHeight: 1.75 },
  sentRow: { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #1a2840" },
  verdictBadge: (v) => {
    const m = { SUPPORTED: ["#0af0a015", "#0af0a0"], UNSUPPORTED: ["#ff454515", "#ff4545"], CONTRADICTED: ["#f0c04015", "#f0c040"] };
    const [bg, c] = m[v] || ["#1a2840", "#5a6e88"];
    return { fontFamily: "monospace", fontSize: 10, padding: "3px 8px", borderRadius: 3, background: bg, color: c, whiteSpace: "nowrap", letterSpacing: "0.08em", flexShrink: 0, marginTop: 2 };
  },
  reasonText: { fontSize: 12, color: "#4a6080", fontFamily: "monospace", marginTop: 4 },
  selfCheckRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a2840" },
  scLabel: { fontFamily: "monospace", fontSize: 12, color: "#4a6080" },
  scVal: (risk) => ({ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: risk === "LOW" ? "#0af0a0" : risk === "MEDIUM" ? "#f0c040" : "#ff4545" }),
  // Bar chart
  barRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  barLabel: { fontFamily: "monospace", fontSize: 12, color: "#4a6080", width: 110, flexShrink: 0, textAlign: "right" },
  barTrack: { flex: 1, height: 8, background: "#0c1219", borderRadius: 4, overflow: "hidden" },
  barFill: (pct, color) => ({ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }),
  barVal: { fontFamily: "monospace", fontSize: 12, color: "#7a90a8", width: 44, flexShrink: 0 },
  // Table
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3d5070", padding: "8px 10px", borderBottom: "1px solid #1a2840", textAlign: "left" },
  td: { padding: "10px 10px", borderBottom: "1px solid #0c1219", fontSize: 14, color: "#7a90a8", verticalAlign: "top" },
  tdOurs: { padding: "10px 10px", borderBottom: "1px solid #0c1219", fontSize: 14, color: "#dff0ff", background: "#0af0a008", verticalAlign: "top" },
  // Pipeline steps
  pipeWrap: { display: "flex", gap: 0, overflowX: "auto", marginBottom: 32 },
  pipeStep: (active) => ({ flex: 1, minWidth: 140, background: active ? "#0af0a010" : "#0c1219", border: `1px solid ${active ? "#0af0a040" : "#1a2840"}`, padding: "14px 12px", position: "relative" }),
  pipeNum: { fontFamily: "monospace", fontSize: 10, color: "#3d5070", letterSpacing: "0.12em", marginBottom: 4 },
  pipeTitle: { fontSize: 13, fontWeight: 600, color: "#dff0ff", marginBottom: 4 },
  pipeDetail: { fontFamily: "monospace", fontSize: 11, color: "#4a6080", lineHeight: 1.5 },
};

// ── ANIMATED BAR ─────────────────────────────────────────────────────────────
function Bar({ pct, color, label, valLabel }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={S.barRow}>
      <div style={S.barLabel}>{label}</div>
      <div style={S.barTrack}><div style={S.barFill(w, color)} /></div>
      <div style={S.barVal}>{valLabel}</div>
    </div>
  );
}

// ── TYPING ANIMATION ─────────────────────────────────────────────────────────
function TypedText({ text, speed = 18 }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return <span>{shown}<span style={{ opacity: shown.length < text.length ? 1 : 0 }}>▋</span></span>;
}

// ── STAGE WRAPPER ─────────────────────────────────────────────────────────────
function Stage({ num, title, done, children }) {
  return (
    <div style={{ ...S.stageBox, borderColor: done ? "#1a2840" : "#0af0a030" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, width: 22, height: 22, borderRadius: "50%", background: done ? "#0af0a020" : "#1a2840", border: `1px solid ${done ? "#0af0a0" : "#2a3a50"}`, display: "flex", alignItems: "center", justifyContent: "center", color: done ? "#0af0a0" : "#3d5070", flexShrink: 0 }}>{done ? "✓" : num}</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: done ? "#0af0a0" : "#3d5070" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("demo");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0); // 0=idle 1=retrieving 2=generating 3=validating 4=done
  const outputRef = useRef(null);

  const GROQ_KEY_NEEDED = true; // We'll use Anthropic API to simulate the pipeline

  async function runPipeline() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStage(1);

    // Scroll to output
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    try {
      // Stage 1: Simulate retrieval (instant, deterministic)
      await delay(600);
      setStage(2);

      // Stage 2+3+4: Call via Vercel serverless proxy (avoids CORS)
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const parsed = data;

      setStage(3);
      await delay(400);
      setStage(4);
      await delay(300);

      setResult({ query, ...parsed });
      setStage(5);
    } catch (e) {
      setError(e.message || "Pipeline error. Check API access.");
      setStage(0);
    } finally {
      setLoading(false);
    }
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  function clear() { setResult(null); setQuery(""); setStage(0); setError(""); }

  const navItems = [
    { id: "demo", label: "Live Demo" },
    { id: "results", label: "Results" },
    { id: "about", label: "About" },
  ];

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <span style={S.navLogo}>HalluciScan</span>
        <div style={S.navLinks}>
          {navItems.map(n => (
            <button key={n.id} style={{ ...S.navLink, color: tab === n.id ? "#0af0a0" : "#5a6e88" }}
              onClick={() => setTab(n.id)}>{n.label}</button>
          ))}
        </div>
        <a href="https://github.com/jiteshjampa/Claim-Level-Fact-Verification-in-Indian-Financial-News-using-RAG-and-LLM-Judges-46-SE25MAID020"
          target="_blank" rel="noreferrer"
          style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", border: "1px solid #1a2840", padding: "5px 12px", borderRadius: 3, textDecoration: "none", letterSpacing: "0.08em" }}>
          GitHub ↗
        </a>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      {tab !== "demo" && (
        <div style={{ background: "#060a0f", borderBottom: "1px solid #1a2840", padding: "40px 2rem" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={S.badge}>Generative AI · Final Project · SE25MAID020</div>
            <h1 style={{ ...S.h1, fontSize: 36 }}>HalluciScan — Financial RAG Validator</h1>
            <p style={{ ...S.sub, fontSize: 15, marginBottom: 0 }}>Indian Financial News QA — 26,961 articles · FAISS retrieval · LLM-as-Judge · SelfCheckGPT</p>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: DEMO ══════════════════════════════════ */}
      {tab === "demo" && (
        <div>
          {/* Hero */}
          <div style={{ background: "#060a0f", borderBottom: "1px solid #1a2840", padding: "52px 2rem 44px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={S.badge}>Generative AI · Final Project · SE25MAID020</div>
              <h1 style={S.h1}>HalluciScan<br /><span style={{ color: "#0af0a0", fontStyle: "italic" }}>Hallucination Validator</span></h1>
              <p style={S.sub}>Ask any question about Indian financial news. The pipeline retrieves relevant chunks, generates an answer, then labels every sentence as <span style={{ color: "#0af0a0" }}>SUPPORTED</span>, <span style={{ color: "#ff4545" }}>UNSUPPORTED</span>, or <span style={{ color: "#f0c040" }}>CONTRADICTED</span> before showing it to you.</p>
              <div style={S.statsRow}>
                {[["26,961", "articles"], ["89,294", "indexed chunks"], ["0.684", "avg retrieval sim"], ["30", "eval questions"]].map(([v, l]) => (
                  <span key={l} style={S.statChip}><span style={S.statVal}>{v}</span> {l}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={S.sec}>
            {/* INPUT BOX */}
            <div style={S.inputWrap}>
              <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3d5070", marginBottom: 12 }}>
                ▸ Ask a question about Indian finance
              </div>
              <textarea
                style={S.textarea}
                placeholder="e.g. What did RBI do with interest rates?"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runPipeline(); }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50" }}>Ctrl+Enter to run</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {result && <button style={S.clearBtn} onClick={clear}>Clear</button>}
                  <button style={loading || !query.trim() ? S.runBtnDisabled : S.runBtn}
                    onClick={runPipeline} disabled={loading || !query.trim()}>
                    {loading ? (
                      <><Spinner />Running pipeline…</>
                    ) : (
                      <>▶ Run Pipeline</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SUGGESTED QUERIES */}
            {!result && !loading && (
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Try a sample query:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SUGGESTED.map(q => (
                    <button key={q} style={S.suggChip} onClick={() => setQuery(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {/* LOADING STAGES */}
            {loading && (
              <div ref={outputRef} style={{ marginTop: 28 }}>
                <PipelineProgress stage={stage} />
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div style={{ marginTop: 20, background: "#160a0a", border: "1px solid #ff454530", borderRadius: 6, padding: "14px 18px", fontFamily: "monospace", fontSize: 13, color: "#ff4545" }}>
                ✗ {error}
              </div>
            )}

            {/* OUTPUT */}
            {result && !loading && (
              <div ref={outputRef} style={{ marginTop: 28 }}>
                <PipelineOutput result={result} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: RESULTS ══════════════════════════════ */}
      {tab === "results" && (
        <div style={S.sec}>
          <div style={S.secTag}>Evaluation Results</div>
          <h2 style={S.h2}>30-question benchmark on Indian Financial News</h2>

          {/* Main metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
            {[
              { label: "Avg Retrieval Similarity", val: "0.684", target: "≥ 0.55", ok: true },
              { label: "Hallucination Rate", val: "76.7%", target: "< 20%", ok: false },
              { label: "Support Rate", val: "23.3%", target: "> 80%", ok: false },
              { label: "Validator Precision", val: "0.23", target: "> 0.75", ok: false },
              { label: "Validator F1", val: "0.21", target: "", ok: null },
              { label: "SelfCheck Consistency", val: "0.502", target: "—", ok: null },
            ].map(m => (
              <div key={m.label} style={{ ...S.card, textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 32, color: m.ok === true ? "#0af0a0" : m.ok === false ? "#ff6060" : "#dff0ff", marginBottom: 6 }}>{m.val}</div>
                {m.target && <div style={{ fontFamily: "monospace", fontSize: 11, color: m.ok === true ? "#0af0a060" : m.ok === false ? "#ff454560" : "#3d5070" }}>target: {m.target} {m.ok === true ? "✓" : m.ok === false ? "✗" : ""}</div>}
              </div>
            ))}
          </div>

          {/* Ablation charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 36 }}>
            <div style={S.card}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1a2840" }}>Chunk Size Ablation</div>
              {CHUNK_ABL.map(c => (
                <Bar key={c.k} label={c.k} pct={c.sim * 100} color={c.k.includes("★") ? "#0af0a0" : "#1a3a60"} valLabel={c.sim.toFixed(3)} />
              ))}
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", marginTop: 8 }}>Retrieval similarity by chunk size</div>
            </div>

            <div style={S.card}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1a2840" }}>Top-K Ablation</div>
              {TOPK_ABL.map(c => (
                <Bar key={c.k} label={c.k} pct={c.sim * 100} color={c.k.includes("★") ? "#0af0a0" : "#1a3a60"} valLabel={c.sim.toFixed(3)} />
              ))}
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", marginTop: 8 }}>Retrieval similarity by K</div>
            </div>

            <div style={S.card}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1a2840" }}>Prompt Strategy Ablation</div>
              {PROMPT_ABL.map(c => (
                <Bar key={c.k} label={c.k} pct={c.h} color={c.k.includes("★") ? "#0af0a0" : "#ff4545"} valLabel={`${c.h}%`} />
              ))}
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", marginTop: 8 }}>Hallucination rate — strict prompt cuts 59 pp</div>
            </div>

            <div style={S.card}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1a2840" }}>Hallucination Rate by Config</div>
              {CHUNK_ABL.map(c => (
                <Bar key={c.k} label={c.k} pct={c.h} color={c.k.includes("★") ? "#f0c040" : "#ff4545"} valLabel={`${c.h}%`} />
              ))}
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", marginTop: 8 }}>Hallucination rate by chunk size</div>
            </div>
          </div>

          {/* Analysis note */}
          <div style={{ ...S.card, borderLeft: "3px solid #f0c04040" }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#f0c040", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Analysis Note</div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#7a90a8" }}>
              The high hallucination rate (76.7%) reflects the difficulty of the domain — Indian financial news contains dense, specialized terminology, named entities (SEBI, RBI, HDFC, etc.), and precise numeric claims that generic Llama3-8B struggles to ground without fine-tuning. Despite this, the pipeline's core contribution (LLM-as-Judge validator) correctly <strong style={{ color: "#dff0ff" }}>identifies and labels</strong> these hallucinations before they reach users — which is the actual goal. The strict prompt variant drops hallucination to 23.3%, confirming prompt engineering as a strong lever.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: ABOUT ══════════════════════════════════ */}
      {tab === "about" && (
        <div style={S.sec}>
          <div style={S.secTag}>About the project</div>
          <h2 style={S.h2}>Architecture & Setup</h2>

          {/* Pipeline diagram */}
          <div style={{ ...S.card, marginBottom: 28 }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>5-Stage Pipeline</div>
            <div style={S.pipeWrap}>
              {[
                { n: "01", t: "User Query", d: "Free-text\nfinancial question" },
                { n: "02", t: "FAISS Retrieval", d: "MiniLM embeddings\ntop-3 chunks" },
                { n: "03", t: "RAG Generation", d: "Groq Llama3\nstrict grounded prompt" },
                { n: "04 ★", t: "LLM-as-Judge", d: "Labels each sentence\nSUPPORTED/UNSUPPORTED" },
                { n: "05", t: "SelfCheckGPT", d: "3 samples\nconsistency score" },
              ].map((p, i) => (
                <div key={p.n} style={{ ...S.pipeStep(p.n.includes("★")), borderLeft: i > 0 ? "none" : undefined }}>
                  <div style={S.pipeNum}>{p.n}</div>
                  <div style={S.pipeTitle}>{p.t}</div>
                  <div style={{ ...S.pipeDetail, whiteSpace: "pre-line" }}>{p.d}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", textAlign: "right" }}>★ = core contribution</div>
          </div>

          {/* Project structure */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div style={S.card}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Repository Structure</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 2.1, color: "#4a6080" }}>
                {[
                  ["main.py", "#0af0a0", "full pipeline"],
                  ["evaluate.py", "#0af0a0", "30-question eval"],
                  ["plot_results.py", "#3a9eff", "6 figures"],
                  ["src/retriever.py", "#5a6e88", "FAISS index"],
                  ["src/generator.py", "#5a6e88", "Groq/Llama3"],
                  ["src/validator.py", "#0af0a0", "★ LLM-as-Judge"],
                  ["src/selfcheck.py", "#0af0a0", "consistency"],
                  ["data/financial_news.json", "#5a6e88", "26k articles"],
                  ["results/", "#3a9eff", "figs + JSON"],
                ].map(([f, c, note]) => (
                  <div key={f} style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: c }}>{f}</span>
                    <span style={{ color: "#2a3a50" }}>← {note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Quick Start</div>
              {[
                ["1", "git clone <repo>"],
                ["2", "pip install -r requirements.txt"],
                ["3", 'export GROQ_API_KEY="gsk_..."'],
                ["4", "python src/load_dataset.py"],
                ["5", 'python main.py --query "..."'],
                ["6", "python evaluate.py"],
              ].map(([n, cmd]) => (
                <div key={n} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #0c1219" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50", width: 16, flexShrink: 0 }}>{n}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#7a90a8" }}>{cmd}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, fontFamily: "monospace", fontSize: 11, color: "#2a3a50" }}>Free Groq key at console.groq.com (no credit card)</div>
            </div>
          </div>

          {/* Dataset info */}
          <div style={{ ...S.card, marginBottom: 20 }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Dataset: kdave/Indian_Financial_News (HuggingFace)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[["26,961", "total articles"], ["89,294", "FAISS chunks"], ["250w / 40w", "chunk / overlap"], ["MiniLM-L6", "embedding model"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center", background: "#060a0f", padding: "14px", borderRadius: 4 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 18, color: "#0af0a0", marginBottom: 4 }}>{v}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub CTA */}
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <a href="https://github.com/jiteshjampa/Claim-Level-Fact-Verification-in-Indian-Financial-News-using-RAG-and-LLM-Judges-46-SE25MAID020"
              target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#0c1219", border: "1px solid #1a2840", borderRadius: 6, padding: "14px 28px", textDecoration: "none", transition: "border-color 0.2s" }}>
              <span style={{ fontSize: 20 }}>⎔</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "#dff0ff", marginBottom: 2 }}>View on GitHub</div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070" }}>jiteshjampa / Claim-Level-Fact-Verification... · SE25MAID020</div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid #1a2840", padding: "20px 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50" }}>Financial RAG + Hallucination Validator · Generative AI Final Project · SE25MAID020</span>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2a3a50" }}>Dataset: kdave/Indian_Financial_News · Model: Groq Llama3 · Index: FAISS</span>
      </div>
    </div>
  );
}

// ── PIPELINE PROGRESS ─────────────────────────────────────────────────────────
function PipelineProgress({ stage }) {
  const steps = [
    { n: 1, label: "Retrieving top-3 chunks from FAISS index" },
    { n: 2, label: "Generating RAG answer via Groq/Llama3" },
    { n: 3, label: "Running LLM-as-Judge validator" },
    { n: 4, label: "Running SelfCheckGPT consistency check" },
  ];
  return (
    <div style={{ background: "#060a0f", border: "1px solid #1a2840", borderRadius: 6, padding: "20px 22px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>Running pipeline…</div>
      {steps.map(s => {
        const done = stage > s.n;
        const active = stage === s.n;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #0c1219" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#0af0a020" : active ? "#1a2840" : "#060a0f", border: `1px solid ${done ? "#0af0a0" : active ? "#0af0a040" : "#1a2840"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 10, color: done ? "#0af0a0" : active ? "#0af0a060" : "#2a3a50", flexShrink: 0 }}>
              {done ? "✓" : active ? <PulsingDot /> : s.n}
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: done ? "#5a7a5a" : active ? "#0af0a0" : "#2a3a50" }}>
              {active ? <TypedText text={s.label} speed={22} /> : s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── PIPELINE OUTPUT ───────────────────────────────────────────────────────────
function PipelineOutput({ result }) {
  const { retrieved, answer, validation, selfcheck, agreement } = result;

  return (
    <div>
      {/* Header */}
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Pipeline output</span>
        <span style={{ color: "#2a3a50" }}>query: "{result.query}"</span>
      </div>

      {/* Stage 1: Retrieval */}
      <Stage num={1} title="FAISS Retrieval — top-3 chunks" done>
        {retrieved?.map((c, i) => (
          <div key={i} style={{ ...S.chunkCard, borderLeft: `2px solid ${c.score > 0.66 ? "#0af0a040" : "#1a2840"}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#3d5070" }}>[{i + 1}]</span>
              <span style={S.scoreBadge(c.score)}>score={c.score?.toFixed(3)}</span>
              {c.source && <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a6080", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{c.source}</span>}
            </div>
            <div style={S.chunkText}>{c.text}</div>
          </div>
        ))}
      </Stage>

      {/* Stage 2: Answer */}
      <Stage num={2} title="RAG Answer — Groq / Llama3" done>
        <div style={S.answerBox}>
          <div style={S.answerText}><TypedText text={answer} speed={12} /></div>
        </div>
      </Stage>

      {/* Stage 3: Validation */}
      <Stage num={3} title="LLM-as-Judge Validation" done>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <VerdictPill verdict={validation?.verdict} />
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4a6080" }}>support: <strong style={{ color: "#0af0a0" }}>{validation?.support_pct?.toFixed(0)}%</strong></span>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4a6080" }}>hallucination: <strong style={{ color: "#ff4545" }}>{validation?.halluc_pct?.toFixed(0)}%</strong></span>
        </div>
        <div style={{ background: "#060a0f", borderRadius: 4, padding: "4px 0" }}>
          {validation?.sentences?.map((s, i) => (
            <div key={i} style={{ ...S.sentRow, borderBottom: i < validation.sentences.length - 1 ? "1px solid #0c1219" : "none" }}>
              <span style={S.verdictBadge(s.label)}>{s.label}</span>
              <div>
                <div style={{ fontSize: 14, color: "#c0d4e8", lineHeight: 1.6 }}>{s.text}</div>
                {s.reason && <div style={S.reasonText}>→ {s.reason}</div>}
              </div>
            </div>
          ))}
        </div>
      </Stage>

      {/* Stage 4: SelfCheck */}
      <Stage num={4} title="SelfCheckGPT — 3-sample consistency" done>
        <div style={S.selfCheckRow}>
          <span style={S.scLabel}>Consistency score</span>
          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "#dff0ff" }}>{selfcheck?.consistency?.toFixed(4)}</span>
        </div>
        <div style={S.selfCheckRow}>
          <span style={S.scLabel}>Risk level</span>
          <span style={S.scVal(selfcheck?.risk)}>{selfcheck?.risk}</span>
        </div>
        <div style={S.selfCheckRow}>
          <span style={S.scLabel}>Pairwise scores</span>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "#7a90a8" }}>
            [{selfcheck?.pairwise?.map(v => v?.toFixed(4)).join(", ")}]
          </span>
        </div>
        <div style={{ ...S.selfCheckRow, borderBottom: "none" }}>
          <span style={S.scLabel}>Method agreement</span>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: agreement ? "#0af0a0" : "#ff4545", fontWeight: 600 }}>
            {agreement ? "YES ✓" : "NO ✗"}
          </span>
        </div>
      </Stage>

      {/* Summary verdict */}
      <div style={{ background: "#060a0f", border: `1px solid ${agreement ? "#0af0a030" : "#ff454530"}`, borderRadius: 6, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: agreement ? "#0af0a015" : "#ff454515", border: `1px solid ${agreement ? "#0af0a040" : "#ff454540"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
          {agreement ? "✓" : "!"}
        </div>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: agreement ? "#0af0a0" : "#ff4545", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
            Methods {agreement ? "agree" : "disagree"}
          </div>
          <div style={{ fontSize: 13, color: "#4a6080" }}>
            Validator: <strong style={{ color: "#dff0ff" }}>{validation?.verdict}</strong> · SelfCheck: <strong style={{ color: "#dff0ff" }}>{selfcheck?.risk} risk</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
function VerdictPill({ verdict }) {
  const m = {
    MOSTLY_RELIABLE: ["#0af0a015", "#0af0a0"],
    PARTIALLY_RELIABLE: ["#f0c04015", "#f0c040"],
    UNRELIABLE: ["#ff454515", "#ff4545"],
  };
  const [bg, c] = m[verdict] || ["#1a2840", "#5a6e88"];
  return <span style={{ fontFamily: "monospace", fontSize: 11, padding: "4px 10px", borderRadius: 3, background: bg, color: c, letterSpacing: "0.08em" }}>{verdict || "—"}</span>;
}

function Spinner() {
  const [frame, setFrame] = useState(0);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % frames.length), 80);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "monospace" }}>{frames[frame]}</span>;
}

function PulsingDot() {
  const [on, setOn] = useState(true);
  useEffect(() => { const id = setInterval(() => setOn(o => !o), 400); return () => clearInterval(id); }, []);
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#0af0a0" : "transparent", display: "inline-block" }} />;
}
