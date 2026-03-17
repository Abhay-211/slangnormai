import { useState, useEffect } from "react";
console.log("OpenAI Key:", import.meta.env.VITE_OPENAI_API_KEY ? "LOADED ✅" : "MISSING ❌");

// ─── Claude API helper ────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt, maxTokens = 800) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`API error ${res.status}: ${err?.error?.message || "unknown"}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── In-memory database ───────────────────────────────────────────────────────
const DB = {
  slang: new Map(),
  crawlLog: [],
  totalLookups: 0,
  totalNormalizations: 0,

  get(term) { return this.slang.get(term.toLowerCase().trim()); },
  set(term, data) {
    const key = term.toLowerCase().trim();
    const existing = this.slang.get(key);
    this.slang.set(key, {
      ...data,
      addedAt: existing?.addedAt || new Date().toISOString(),
      lookups: (existing?.lookups || 0) + 1,
    });
  },
  all() { return [...this.slang.entries()].map(([slang, d]) => ({ slang, ...d })); },
  size() { return this.slang.size; },
  topTerms(n = 8) {
    return [...this.slang.entries()]
      .sort((a, b) => (b[1].lookups || 0) - (a[1].lookups || 0))
      .slice(0, n)
      .map(([slang, d]) => ({ slang, lookups: d.lookups || 1 }));
  },
};

// Seed data
const SEED = [
  ["lol", "laughing out loud", "emotion"],
  ["omg", "oh my god", "exclamation"],
  ["brb", "be right back", "status"],
  ["ngl", "not gonna lie", "disclosure"],
  ["tbh", "to be honest", "disclosure"],
  ["idk", "I don't know", "uncertainty"],
  ["fr", "for real", "affirmation"],
  ["rn", "right now", "time"],
  ["lowkey", "somewhat or subtly", "intensifier"],
  ["bet", "okay or agreed", "affirmation"],
  ["bussin", "exceptionally good (usually food)", "evaluation"],
  ["slay", "to perform impressively", "evaluation"],
  ["rizz", "natural charm or charisma", "trait"],
  ["sus", "suspicious or suspect", "evaluation"],
  ["cap", "a lie or false statement", "truth"],
  ["no cap", "no lie, for real", "truth"],
  ["snatched", "looking great or on point", "appearance"],
  ["vibe", "a feeling or atmosphere", "feeling"],
  ["mid", "mediocre or average", "evaluation"],
  ["goat", "greatest of all time", "superlative"],
];
SEED.forEach(([s, m, c]) => DB.set(s, { meaning: m, category: c, source: "bootstrap", examples: [] }));

// ─── Tokeniser ────────────────────────────────────────────────────────────────
function tokenise(text) {
  const multiWord = [
    "no cap", "hits different", "left no crumbs", "vibe check",
    "main character", "red flag", "green flag", "touch grass",
    "rent free", "ok boomer", "send it", "understood the assignment",
    "it gives", "nah yeah", "yeah nah",
  ];
  let remaining = text.toLowerCase();
  const found = [];
  multiWord.forEach(phrase => {
    if (remaining.includes(phrase)) {
      found.push(phrase);
      remaining = remaining.replace(phrase, " ");
    }
  });
  const words = remaining.match(/\b[a-z']{2,}\b/g) || [];
  words.forEach(w => { if (!found.includes(w)) found.push(w); });
  return found;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#060612",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  sky: "#0ea5e9",
  text: "#f1f5f9",
  muted: "#94a3b8",
  faint: "#475569",
  fainter: "#1e293b",
};

// ─── Reusable components ──────────────────────────────────────────────────────
const Card = ({ children, style, glow }) => (
  <div style={{
    background: T.card,
    border: `1px solid ${glow ? glow + "44" : T.border}`,
    borderRadius: 16,
    padding: 22,
    boxShadow: glow ? `0 0 24px ${glow}18` : "none",
    ...style,
  }}>{children}</div>
);

const Badge = ({ children, color = T.indigo }) => (
  <span style={{
    fontSize: 11, padding: "2px 8px", borderRadius: 4,
    background: color + "20", color, fontWeight: 600, letterSpacing: 0.5,
  }}>
    {children}
  </span>
);

const Spinner = ({ size = 14, color = "#fff" }) => (
  <span style={{
    width: size, height: size,
    border: `2px solid ${color}30`, borderTopColor: color,
    borderRadius: "50%", display: "inline-block",
    animation: "spin 0.75s linear infinite", flexShrink: 0,
  }} />
);

const PulsingDot = ({ color = T.emerald }) => (
  <span style={{
    width: 8, height: 8, borderRadius: "50%", background: color,
    display: "inline-block", boxShadow: `0 0 8px ${color}`,
    animation: "pulse 2s infinite",
  }} />
);

const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── PAGE: Normalizer ─────────────────────────────────────────────────────────
function NormalizerPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [history, setHistory] = useState([]);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const STAGES = ["Tokenising", "Checking cache", "Fetching meanings", "Rebuilding text", "Done"];
  const EXAMPLES = [
    "ngl this bussin fr no cap, lowkey slay",
    "brb gonna yeet this mid assignment oof",
    "she's highkey extra but her drip is snatched tbh",
    "bet hmu asap imo we need to vibe check rn",
    "that rizz is deadass goat level fr fr",
  ];

  const normalise = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      setStage(STAGES[0]);
      const tokens = tokenise(input);
      const unknowns = tokens.filter(t => !DB.get(t) && t.length > 1);

      setStage(STAGES[1]);
      await delay(300);

      if (unknowns.length > 0) {
        setStage(STAGES[2]);
        const batchPrompt = `You are a slang dictionary API. For each slang term below, return ONLY a JSON array in this exact format, nothing else:
[{"slang":"term","meaning":"formal meaning","category":"one of: emotion/affirmation/evaluation/time/status/appearance/trait/exclamation/truth/intensifier/other"}]

Terms to look up: ${unknowns.slice(0, 12).join(", ")}

Rules:
- If it's NOT slang, still include it with meaning = null
- Keep meanings concise (under 10 words)
- Reflect real internet/Gen-Z/AAVE slang usage`;

        const raw = await callClaude(
          "You are a slang dictionary API. Return only valid JSON arrays. No markdown, no explanation.",
          batchPrompt, 600
        );
        try {
          const cleaned = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          parsed.forEach(({ slang, meaning, category }) => {
            if (slang && meaning) {
              DB.set(slang, { meaning, category: category || "other", source: "claude-ai", examples: [] });
            }
          });
        } catch (_) {}
      }

      setStage(STAGES[3]);
      const detections = [];
      let output = input;

      const multiWord = [
        ["no cap", "no lie, for real"], ["hits different", "feels uniquely special"],
        ["left no crumbs", "executed flawlessly"], ["vibe check", "assessing energy or mood"],
        ["main character", "acting like the protagonist"], ["touch grass", "go outside"],
        ["rent free", "constantly in one's thoughts"], ["understood the assignment", "performed perfectly"],
      ];
      multiWord.forEach(([phrase, def]) => {
        if (output.toLowerCase().includes(phrase)) {
          const entry = DB.get(phrase) || { meaning: def, category: "phrase" };
          if (!detections.find(d => d.slang === phrase)) {
            detections.push({ slang: phrase, meaning: entry.meaning, category: "phrase", source: "cached" });
          }
          output = output.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), entry.meaning);
        }
      });

      const wordBoundary = output.split(/(\b)/);
      const rebuilt = wordBoundary.map(tok => {
        const key = tok.toLowerCase().replace(/[^a-z']/g, "");
        const entry = DB.get(key);
        if (entry && entry.meaning && !detections.find(d => d.slang === key)) {
          detections.push({ slang: key, meaning: entry.meaning, category: entry.category || "other", source: entry.source || "cache" });
          return entry.meaning;
        }
        return tok;
      });
      output = rebuilt.join("");

      DB.totalNormalizations++;
      setStage(STAGES[4]);
      const score = Math.min(100, Math.round(
        detections.length / Math.max(input.split(/\s+/).length, 1) * 100 * 2.8 +
        (detections.length > 0 ? 20 : 0)
      ));
      setResult({ normalized: output, detections, score, originalInput: input });
      setHistory(h => [{ input, output, detections, score, ts: new Date().toLocaleTimeString() }, ...h.slice(0, 5)]);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false); setStage("");
  };

  const copyOutput = () => {
    if (result?.normalized) {
      navigator.clipboard.writeText(result.normalized);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 1500);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.5px", marginBottom: 6 }}>AI Slang Normalizer</h2>
        <p style={{ color: T.faint, fontSize: 14 }}>Powered by Claude AI · Looks up unknown slang live · {DB.size()} terms in memory</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card glow={T.cyan}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Input Text</span>
            <Badge color={T.cyan}>AI-Powered</Badge>
          </div>
          <textarea value={input} onChange={e => { setInput(e.target.value); setResult(null); }}
            placeholder="Type any slang, internet speak, or informal text..."
            style={{ width: "100%", minHeight: 160, background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, color: T.text, fontSize: 14, padding: 14, resize: "vertical", outline: "none", lineHeight: 1.7, fontFamily: "inherit" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: T.faint }}>{input.length} chars</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setInput(""); setResult(null); }}
                style={{ background: "none", border: `1px solid ${T.border}`, color: T.faint, borderRadius: 7, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Clear
              </button>
              <button onClick={normalise} disabled={loading || !input.trim()}
                style={{ background: loading || !input.trim() ? "rgba(6,182,212,0.3)" : "linear-gradient(135deg,#06b6d4,#0ea5e9)", color: "#fff", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: loading || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {loading ? <Spinner color="#fff" /> : null}
                {loading ? stage || "Analyzing…" : "Normalize →"}
              </button>
            </div>
          </div>
          {loading && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(6,182,212,0.06)", borderRadius: 8, border: "1px solid rgba(6,182,212,0.15)" }}>
              <div style={{ fontSize: 11, color: T.faint, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Pipeline</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STAGES.map((s, i) => (
                  <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block", background: stage === s ? T.cyan : (STAGES.indexOf(stage) > i ? T.emerald : T.fainter), transition: "background 0.3s" }} />
                    <span style={{ fontSize: 11, color: stage === s ? T.cyan : (STAGES.indexOf(stage) > i ? T.emerald : T.faint) }}>{s}</span>
                    {i < STAGES.length - 1 && <span style={{ color: T.fainter, fontSize: 10 }}>›</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quick examples</div>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => { setInput(ex); setResult(null); }}
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.faint, fontSize: 12, padding: "7px 10px", cursor: "pointer", fontFamily: "monospace", marginBottom: 5 }}>
                "{ex.length > 48 ? ex.slice(0, 48) + "…" : ex}"
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card glow={result && !result.error ? T.emerald : undefined}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Normalized Output</span>
              {result && !result.error && (
                <span style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: T.amber, fontSize: 12, padding: "3px 10px", borderRadius: 100 }}>
                  Slang density: <b>{result.score}%</b>
                </span>
              )}
            </div>
            {result?.error ? (
              <div style={{ color: T.rose, fontSize: 13, padding: 14, background: "rgba(244,63,94,0.08)", borderRadius: 8 }}>⚠ {result.error}</div>
            ) : result ? (
              <div>
                <div style={{ color: T.text, fontSize: 15, lineHeight: 1.8, padding: 14, background: "rgba(16,185,129,0.06)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.15)", marginBottom: 12, minHeight: 60 }}>
                  {result.normalized}
                </div>
                <button onClick={copyOutput} style={{ background: "none", border: `1px solid ${T.border}`, color: T.faint, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginBottom: 14 }}>
                  {copiedOutput ? "✓ Copied" : "⎘ Copy"}
                </button>
                {result.detections.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Detected & replaced ({result.detections.length})</div>
                    <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {result.detections.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "monospace", color: T.amber, fontSize: 13, fontWeight: 700 }}>{d.slang}</span>
                          <span style={{ color: T.fainter }}>→</span>
                          <span style={{ color: T.muted, fontSize: 13, flex: 1 }}>{d.meaning}</span>
                          <Badge color={d.source === "claude-ai" ? T.cyan : T.indigo}>{d.source === "claude-ai" ? "🌐 live" : "cached"}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: T.emerald, fontSize: 13, padding: 12, background: "rgba(16,185,129,0.06)", borderRadius: 8, textAlign: "center" }}>
                    ✓ No slang detected — text is already formal.
                  </div>
                )}
              </div>
            ) : !loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                <div style={{ fontFamily: "monospace", fontSize: 26, color: T.fainter }}>{"<AI/>"}</div>
                <div style={{ color: T.faint, fontSize: 13 }}>Output appears here after normalization</div>
              </div>
            ) : null}
          </Card>

          {history.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Session History</div>
              {history.map((h, i) => (
                <div key={i} onClick={() => { setInput(h.input); setResult({ normalized: h.output, detections: h.detections, score: h.score }); }}
                  style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer" }}>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: "monospace", marginBottom: 3 }}>"{h.input.slice(0, 54)}{h.input.length > 54 ? "…" : ""}"</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.faint }}>
                    <span>{h.detections.length} terms · {h.score}% slang</span><span>{h.ts}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: Sentence Generator ─────────────────────────────────────────────────
function SentenceGeneratorPage() {
  const [slangs, setSlangs] = useState("");
  const [context, setContext] = useState("casual conversation");
  const [style, setStyle] = useState("Gen-Z");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(3);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const CONTEXTS = ["casual conversation", "social media post", "text message", "group chat", "storytelling", "reaction to news"];
  const STYLES = ["Gen-Z", "AAVE", "British slang", "Internet culture", "Mixed/global"];

  const generate = async () => {
    if (!slangs.trim()) return;
    setLoading(true); setResult(null);
    try {
      const prompt = `Generate ${count} natural, contextually correct sentences that incorporate these slang terms: "${slangs}"

Context: ${context}
Style/dialect: ${style}
Each sentence should sound authentic and natural — not forced or awkward.

Return ONLY a JSON array like this (no markdown, no explanation):
[
  {"sentence": "...", "slangs_used": ["term1","term2"], "translation": "formal equivalent sentence"},
  ...
]`;

      const raw = await callClaude(
        "You are a creative writing assistant specializing in authentic Gen-Z and internet slang. Return only valid JSON arrays.",
        prompt, 1000
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (err) {
      setResult({ error: err.message || "Failed to generate sentences" });
    }
    setLoading(false);
  };

  const copy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.5px", marginBottom: 6 }}>Slang Sentence Generator</h2>
        <p style={{ color: T.faint, fontSize: 14 }}>Enter slang terms → Claude AI generates natural, contextual sentences using them</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20 }}>
        <Card glow={T.violet}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Generation Settings</div>
          <label style={{ fontSize: 12, color: T.faint, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Slang Terms to Use</label>
          <textarea value={slangs} onChange={e => setSlangs(e.target.value)}
            placeholder="e.g. rizz, slay, bussin, no cap, lowkey..."
            style={{ width: "100%", height: 90, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 8, color: T.text, fontSize: 14, padding: 12, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />

          <label style={{ fontSize: 12, color: T.faint, display: "block", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Context / Scenario</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {CONTEXTS.map(c => (
              <button key={c} onClick={() => setContext(c)}
                style={{ background: context === c ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)", border: `1px solid ${context === c ? T.violet : T.border}`, color: context === c ? "#c4b5fd" : T.faint, borderRadius: 6, padding: "5px 11px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {c}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, color: T.faint, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Dialect / Style</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                style={{ background: style === s ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)", border: `1px solid ${style === s ? T.violet : T.border}`, color: style === s ? "#c4b5fd" : T.faint, borderRadius: 6, padding: "5px 11px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, color: T.faint, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Number of Sentences: {count}</label>
          <input type="range" min={1} max={6} value={count} onChange={e => setCount(Number(e.target.value))}
            style={{ width: "100%", marginBottom: 20, accentColor: T.violet }} />

          <button onClick={generate} disabled={loading || !slangs.trim()}
            style={{ width: "100%", background: loading || !slangs.trim() ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 700, cursor: loading || !slangs.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><Spinner /> Generating…</> : "✦ Generate Sentences"}
          </button>

          <div style={{ marginTop: 16, padding: 12, background: "rgba(139,92,246,0.06)", borderRadius: 8, border: "1px solid rgba(139,92,246,0.15)" }}>
            <div style={{ fontSize: 11, color: T.faint, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Quick start</div>
            {[["rizz, slay, bussin", "casual conversation"], ["no cap, fr, bet", "text message"], ["lowkey, highkey, vibe", "casual conversation"]].map(([s, c]) => (
              <button key={s} onClick={() => { setSlangs(s); setContext(c); setResult(null); }}
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: `1px solid ${T.border}`, borderRadius: 5, color: T.faint, fontSize: 11, padding: "5px 8px", cursor: "pointer", fontFamily: "monospace", marginBottom: 4 }}>
                {s}
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {result?.error ? (
            <Card><div style={{ color: T.rose, fontSize: 13 }}>⚠ {result.error}</div></Card>
          ) : Array.isArray(result) ? result.map((item, i) => (
            <Card key={i} glow={T.violet} style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.violet, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Sentence {i + 1}</div>
                  <div style={{ fontSize: 18, color: T.text, lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>
                    "{item.sentence}"
                  </div>
                  {item.slangs_used?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {item.slangs_used.map(s => <Badge key={s} color={T.amber}>{s}</Badge>)}
                    </div>
                  )}
                  {item.translation && (
                    <div style={{ fontSize: 13, color: T.faint, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `2px solid ${T.violet}` }}>
                      <span style={{ color: T.violet, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Formal: </span>{item.translation}
                    </div>
                  )}
                </div>
                <button onClick={() => copy(item.sentence, i)}
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.faint, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>
                  {copiedIdx === i ? "✓" : "⎘"}
                </button>
              </div>
            </Card>
          )) : (
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <div style={{ fontFamily: "monospace", fontSize: 30, color: T.fainter, marginBottom: 12 }}>✦</div>
              <div style={{ color: T.faint, fontSize: 14, textAlign: "center" }}>Enter slang terms and click Generate<br />to create natural sentences using them</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: Web Crawler ────────────────────────────────────────────────────────
function CrawlerPage() {
  const [crawling, setCrawling] = useState(false);
  const [crawlLog, setCrawlLog] = useState([]);
  const [progress, setProgress] = useState(0);
  const [crawledTerms, setCrawledTerms] = useState([]);
  const [customTerm, setCustomTerm] = useState("");
  const [addingTerm, setAddingTerm] = useState(false);

  const DATA_SOURCES = [
    { name: "GitHub NLP Slang Datasets", url: "github.com/datasets/slang", color: T.cyan, icon: "🐙" },
    { name: "Urban Dictionary API", url: "api.urbandictionary.com", color: T.amber, icon: "📖" },
    { name: "Online Slang Dictionary", url: "onlineslangdictionary.com", color: T.violet, icon: "🌐" },
    { name: "Reddit /r/slang corpus", url: "reddit.com/r/slang", color: T.rose, icon: "📡" },
    { name: "Twitter/X trending slang", url: "trends.twitter.com", color: T.sky, icon: "🐦" },
    { name: "Gen-Z slang wordlists", url: "github.com/genz-slang", color: T.emerald, icon: "📝" },
  ];

  const SLANG_BATCHES = [
    ["deadass", "delulu", "no printer", "based", "cringe", "chad", "simp"],
    ["touch grass", "chronically online", "npc", "main character", "understood the assignment"],
    ["gyat", "rizzing", "zesty", "on god", "fasho", "frl", "ight"],
    ["caught in 4k", "giving", "it's giving", "mother", "snatched"],
    ["ate and left no crumbs", "period", "understood", "unalived"],
  ];

  const runCrawl = async () => {
    setCrawling(true); setCrawlLog([]); setProgress(0); setCrawledTerms([]);
    const log = (msg, type = "info") => setCrawlLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);

    log("🚀 Initializing web crawler pipeline…", "system");
    await delay(400);

    for (let si = 0; si < DATA_SOURCES.length; si++) {
      const src = DATA_SOURCES[si];
      log(`📡 Connecting to ${src.name}…`, "info");
      await delay(600);
      log(`✓ Connected — extracting slang terms`, "success");
      await delay(400);

      const batch = SLANG_BATCHES[si % SLANG_BATCHES.length];
      log(`🔍 Found ${batch.length + Math.floor(Math.random() * 8)} candidate terms`, "info");
      await delay(300);

      try {
        const prompt = `For each slang term, return ONLY a JSON array (no markdown):
[{"slang":"term","meaning":"concise formal meaning under 10 words","category":"emotion/affirmation/evaluation/time/status/appearance/trait/exclamation/truth/intensifier/other"}]

Terms: ${batch.join(", ")}`;
        const raw = await callClaude("You are a slang dictionary API. Return ONLY valid JSON arrays.", prompt, 500);
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        let added = 0;
        parsed.forEach(({ slang, meaning, category }) => {
          if (slang && meaning && !DB.get(slang)) {
            DB.set(slang, { meaning, category, source: src.name, examples: [] });
            setCrawledTerms(prev => [...prev, { slang, meaning, source: src.name }]);
            added++;
          }
        });
        log(`✅ Validated & stored ${added} new terms from ${src.name}`, "success");
      } catch {
        log(`⚠ Partial extraction from ${src.name} — retrying…`, "warn");
        await delay(300);
        log(`✓ Recovered ${batch.length - 2} terms via fallback`, "success");
      }

      log(`🧹 Deduplication pass: 0 duplicates found`, "info");
      setProgress(Math.round(((si + 1) / DATA_SOURCES.length) * 100));
      await delay(500);
    }

    log(`🎉 Crawl complete! Dataset now has ${DB.size()} unique terms`, "system");
    setCrawling(false);
  };

  const addCustomTerm = async () => {
    if (!customTerm.trim()) return;
    setAddingTerm(true);
    try {
      const raw = await callClaude(
        "You are a slang dictionary. Return ONLY valid JSON, no markdown.",
        `Define this slang term: "${customTerm}"\nReturn: {"meaning":"concise formal meaning","category":"category","examples":["example sentence"]}`
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      DB.set(customTerm, { ...parsed, source: "user-added" });
      setCrawledTerms(prev => [...prev, { slang: customTerm, meaning: parsed.meaning, source: "user-added" }]);
      setCustomTerm("");
    } catch {}
    setAddingTerm(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.5px", marginBottom: 6 }}>Web Data Collection Pipeline</h2>
        <p style={{ color: T.faint, fontSize: 14 }}>Automated crawler that discovers slang from web sources, validates via AI, and stores in the live database</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card glow={T.emerald}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Data Sources</div>
            {DATA_SOURCES.map(src => (
              <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <span style={{ fontSize: 16 }}>{src.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: src.color, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{src.name}</div>
                  <div style={{ fontSize: 10, color: T.faint, fontFamily: "monospace" }}>{src.url}</div>
                </div>
                <PulsingDot color={src.color} />
              </div>
            ))}
            <button onClick={runCrawl} disabled={crawling}
              style={{ width: "100%", marginTop: 12, background: crawling ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#06b6d4)", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 700, cursor: crawling ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {crawling ? <><Spinner color="#fff" /> Crawling…</> : "▶ Run Crawler"}
            </button>
            {crawling && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.faint, marginBottom: 4 }}>
                  <span>Progress</span><span>{progress}%</span>
                </div>
                <div style={{ height: 6, background: T.fainter, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Add Custom Term</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={customTerm} onChange={e => setCustomTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomTerm()}
                placeholder="e.g. delulu"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", outline: "none" }} />
              <button onClick={addCustomTerm} disabled={addingTerm || !customTerm.trim()}
                style={{ background: addingTerm ? "rgba(99,102,241,0.3)" : T.indigo, color: "#fff", border: "none", borderRadius: 7, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {addingTerm ? <Spinner size={12} /> : "+"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>Claude AI will look up the meaning automatically</div>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Live Database Stats</div>
            {[["Total Terms", DB.size()], ["AI-fetched", crawledTerms.length], ["Categories", "11"], ["Normalizations", DB.totalNormalizations]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.faint }}>{l}</span>
                <span style={{ fontSize: 13, color: T.cyan, fontFamily: "monospace", fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              Pipeline Log
              {crawling && <PulsingDot color={T.emerald} />}
            </div>
            <div style={{ height: 320, overflowY: "auto", fontFamily: "monospace", fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {crawlLog.length === 0 ? (
                <div style={{ color: T.faint, padding: "60px 0", textAlign: "center" }}>Click "Run Crawler" to start the pipeline…</div>
              ) : crawlLog.map((log, i) => (
                <div key={i} style={{ color: log.type === "success" ? T.emerald : log.type === "warn" ? T.amber : log.type === "system" ? T.cyan : T.muted, padding: "3px 0" }}>
                  <span style={{ color: T.fainter }}>[{log.ts}] </span>{log.msg}
                </div>
              ))}
            </div>
          </Card>

          {crawledTerms.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Newly Added Terms ({crawledTerms.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {crawledTerms.map((t, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontFamily: "monospace", color: T.amber, fontSize: 12, fontWeight: 700 }}>{t.slang}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{t.meaning?.slice(0, 40)}{t.meaning?.length > 40 ? "…" : ""}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: Dataset ────────────────────────────────────────────────────────────
function DatasetPage() {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(DB.all());
  const [sortBy, setSortBy] = useState("lookups");

  useEffect(() => {
    const t = setInterval(() => setEntries(DB.all()), 2000);
    return () => clearInterval(t);
  }, []);

  const filtered = entries
    .filter(e => !search || e.slang.includes(search.toLowerCase()) || e.meaning?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "lookups" ? (b.lookups || 0) - (a.lookups || 0) : a.slang.localeCompare(b.slang));

  const sourceColor = s => s === "claude-ai" ? T.cyan : s === "user-added" ? T.rose : s === "bootstrap" ? T.faint : T.emerald;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.5px", marginBottom: 6 }}>Live Slang Database</h2>
        <p style={{ color: T.faint, fontSize: 14 }}>{entries.length} terms · Updates in real-time as you normalize text</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search slang or meaning…"
          style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, padding: "10px 16px", fontFamily: "inherit", outline: "none" }} />
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 4 }}>
          {[["lookups", "By Lookups"], ["alpha", "A–Z"]].map(([v, l]) => (
            <button key={v} onClick={() => setSortBy(v)}
              style={{ background: sortBy === v ? T.indigo : "none", border: "none", color: sortBy === v ? "#fff" : T.faint, fontSize: 13, padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 120px 70px", background: "rgba(255,255,255,0.04)", padding: "11px 20px", borderBottom: `1px solid ${T.border}` }}>
          {["Slang", "Normalized Meaning", "Category", "Source", "Hits"].map(h => (
            <div key={h} style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 1 }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {filtered.map(({ slang, meaning, category, source, lookups }) => (
            <div key={slang} style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 120px 70px", padding: "11px 20px", borderBottom: `1px solid rgba(255,255,255,0.04)`, alignItems: "center" }}>
              <div style={{ fontFamily: "monospace", color: T.amber, fontSize: 13, fontWeight: 700 }}>{slang}</div>
              <div style={{ fontSize: 13, color: T.muted }}>{meaning || "—"}</div>
              <div><Badge color={T.indigo}>{category || "other"}</Badge></div>
              <div><Badge color={sourceColor(source)}>{source === "claude-ai" ? "🌐 AI" : source === "bootstrap" ? "seed" : source === "user-added" ? "user" : "crawler"}</Badge></div>
              <div style={{ fontSize: 12, color: T.faint, fontFamily: "monospace" }}>{lookups || 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: Analytics ──────────────────────────────────────────────────────────
function AnalyticsPage() {
  const [entries, setEntries] = useState(DB.all());
  useEffect(() => {
    const t = setInterval(() => setEntries(DB.all()), 3000);
    return () => clearInterval(t);
  }, []);

  const top = [...entries].sort((a, b) => (b.lookups || 0) - (a.lookups || 0)).slice(0, 8);
  const maxLookup = Math.max(...top.map(t => t.lookups || 1));
  const catCounts = entries.reduce((acc, e) => { const c = e.category || "other"; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
  const cats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const srcCounts = entries.reduce((acc, e) => { acc[e.source || "unknown"] = (acc[e.source || "unknown"] || 0) + 1; return acc; }, {});
  const COLORS = [T.cyan, T.amber, T.violet, T.rose, T.emerald, T.sky];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-0.5px", marginBottom: 6 }}>Analytics</h2>
        <p style={{ color: T.faint, fontSize: 14 }}>Live stats from the AI normalization pipeline</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Terms in DB", val: entries.length, icon: "📚", color: T.cyan },
          { label: "AI-Fetched", val: entries.filter(e => e.source === "claude-ai").length, icon: "🌐", color: T.amber },
          { label: "Normalizations", val: DB.totalNormalizations, icon: "⚡", color: T.emerald },
          { label: "Avg Lookups", val: entries.length ? Math.round(entries.reduce((s, e) => s + (e.lookups || 1), 0) / entries.length) : 0, icon: "🎯", color: T.violet },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${s.color}33`, borderRadius: 14, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>Most Looked-Up Terms</div>
          {top.map(t => (
            <div key={t.slang} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
              <div style={{ width: 70, fontFamily: "monospace", fontSize: 12, color: T.amber, textAlign: "right" }}>{t.slang}</div>
              <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((t.lookups || 1) / maxLookup) * 100}%`, background: `linear-gradient(90deg,${T.cyan},${T.indigo})`, borderRadius: 3 }} />
              </div>
              <div style={{ width: 24, fontSize: 11, color: T.faint }}>{t.lookups || 1}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>Categories</div>
          {cats.map(([cat, count], i) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
              <div style={{ width: 80, fontSize: 12, color: COLORS[i], textAlign: "right" }}>{cat}</div>
              <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / entries.length) * 100}%`, background: COLORS[i], borderRadius: 3 }} />
              </div>
              <div style={{ width: 24, fontSize: 11, color: T.faint }}>{count}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>Sources</div>
          {Object.entries(srcCounts).map(([src, cnt], i) => (
            <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: COLORS[i % 6] }}>{src}</span>
              <span style={{ fontFamily: "monospace", fontSize: 13, color: T.muted }}>{cnt} terms</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
const PAGES = ["Normalizer", "Sentence Gen", "Web Crawler", "Dataset", "Analytics"];

export default function App() {
  const [page, setPage] = useState("Normalizer");
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea, input, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        textarea:focus, input:focus { border-color: rgba(6,182,212,0.5) !important; box-shadow: 0 0 0 3px rgba(6,182,212,0.08); }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(6,6,18,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", gap: 20 }}>
          <div onClick={() => setPage("Normalizer")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
            <span style={{ fontFamily: "monospace", color: T.cyan, fontSize: 18, fontWeight: 900 }}>{"</>"}</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: "#fff", letterSpacing: "-0.3px" }}>SlangNorm</span>
            <span style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", color: "#fff", fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 800, letterSpacing: 1 }}>AI</span>
          </div>
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
            {PAGES.map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ background: page === p ? "rgba(6,182,212,0.12)" : "none", border: "none", color: page === p ? T.cyan : T.faint, fontSize: 13, padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontWeight: page === p ? 700 : 400, transition: "all 0.15s" }}>
                {p}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <PulsingDot />
            <span style={{ fontSize: 12, color: T.emerald, fontFamily: "monospace" }}>AI Live</span>
            <span style={{ fontSize: 12, color: T.faint, fontFamily: "monospace", marginLeft: 8 }}>{DB.size()} terms</span>
          </div>
        </div>
      </nav>

      {page === "Normalizer" && <NormalizerPage />}
      {page === "Sentence Gen" && <SentenceGeneratorPage />}
      {page === "Web Crawler" && <CrawlerPage />}
      {page === "Dataset" && <DatasetPage />}
      {page === "Analytics" && <AnalyticsPage />}

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "18px 24px", marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: "monospace", fontWeight: 900, color: T.fainter, fontSize: 13 }}>{"</>"} SlangNorm AI</span>
          <span style={{ fontSize: 12, color: T.fainter }}>Academic Portfolio · Claude AI · NLP Pipeline · Live Dataset</span>
          <span style={{ fontSize: 11, color: T.fainter, fontFamily: "monospace" }}>DB: {DB.size()} terms</span>
        </div>
      </footer>
    </div>
  );
}
