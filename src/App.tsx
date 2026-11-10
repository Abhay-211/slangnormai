import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Database,
  Radio,
  Copy,
  Check,
  Search,
  Play,
  ArrowRight,
  Plus,
  Zap,
  Cpu,
  Sliders,
  Terminal,
  ExternalLink,
  Trash2,
  Download,
  Filter,
  Globe,
  Flame,
  Gamepad2,
  Smile,
  ShieldCheck,
  RefreshCw,
  Hash,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { DB } from "./services/db";
import { callAI, crawlSlang } from "./services/api";
import { generateDynamicSentences, extractSlangTerms } from "./services/sentenceGen";
import { LandingHero } from "./components/LandingHero";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { GlitchLogo3D } from "./components/GlitchLogo3D";
import {
  CrawlSource,
  Detection,
  GeneratedSentence,
  HistoryItem,
  NormalizerResult,
  SlangEntry,
} from "./types";

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
  faint: "#64748b",
  fainter: "#334155",
};

// ─── Default Crawl Sources with actual URLs ───────────────────────────────────
const DEFAULT_SOURCES: CrawlSource[] = [
  {
    id: "urbandictionary",
    name: "Urban Dictionary Trending",
    url: "https://www.urbandictionary.com/trending.php",
    category: "crowdsourced",
    color: T.amber,
    icon: "📖",
    enabled: true,
    description: "Daily viral vernacular, crowdsourced definitions, and slang of the day",
  },
  {
    id: "tiktok",
    name: "TikTok & Reels Vernacular",
    url: "https://www.tiktok.com/tag/slang",
    category: "social",
    color: T.rose,
    icon: "🎵",
    enabled: true,
    description: "Short-form video trends, Gen-Z audio memes, and micro-slang",
  },
  {
    id: "reddit",
    name: "Reddit /r/GenZ & /r/slang",
    url: "https://www.reddit.com/r/GenZ",
    category: "community",
    color: T.sky,
    icon: "📡",
    enabled: true,
    description: "Discussion boards, linguistic evolution debates, and youth culture",
  },
  {
    id: "twitch",
    name: "Twitch & Discord Gaming Lexicon",
    url: "https://twitch.tv/directory",
    category: "gaming",
    color: T.violet,
    icon: "🎮",
    enabled: true,
    description: "Esports chatter, streamer jargon, emotes, and speedrun slang",
  },
  {
    id: "knowyourmeme",
    name: "Know Your Meme Cultural DB",
    url: "https://knowyourmeme.com/memes/culture",
    category: "research",
    color: T.emerald,
    icon: "🧠",
    enabled: true,
    description: "Documented internet folklore, meme origins, and subculture idioms",
  },
  {
    id: "twitter",
    name: "X / Twitter Trending Neologisms",
    url: "https://x.com/explore/tabs/trending",
    category: "trending",
    color: T.cyan,
    icon: "🐦",
    enabled: true,
    description: "Fast-moving hashtag vernacular, stan-twitter slang, and news reactions",
  },
  {
    id: "ukdrill",
    name: "UK Drill & British Slang",
    url: "https://www.urbandictionary.com/define.php?term=uk-drill",
    category: "regional",
    color: T.indigo,
    icon: "🇬🇧",
    enabled: true,
    description: "London roadman slang, British urban vernacular, and drill music terms",
  },
  {
    id: "aussie",
    name: "Australian & Regional Lexicon",
    url: "https://kalliergeia.com/en/aussie-slang",
    category: "regional",
    color: T.teal,
    icon: "🇦🇺",
    enabled: true,
    description: "Colloquial Australian diminutives, surf culture, and regional jargon",
  },
];

// ─── Reusable UI Components ───────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  glow?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, style, glow, className = "" }) => (
  <div
    className={`rounded-2xl border transition-all duration-300 ${className}`}
    style={{
      background: T.card,
      borderColor: glow ? glow + "44" : T.border,
      boxShadow: glow ? `0 0 30px ${glow}15` : "none",
      padding: 22,
      ...style,
    }}
  >
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({
  children,
  color = T.indigo,
  className = "",
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${className}`}
    style={{
      background: color + "20",
      color: color,
      border: `1px solid ${color}40`,
    }}
  >
    {children}
  </span>
);

const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = "#fff" }) => (
  <span
    className="inline-block animate-spin rounded-full shrink-0"
    style={{
      width: size,
      height: size,
      border: `2px solid ${color}30`,
      borderTopColor: color,
    }}
  />
);

const PulsingDot: React.FC<{ color?: string }> = ({ color = T.emerald }) => (
  <span
    className="inline-block w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
    style={{
      background: color,
      boxShadow: `0 0 10px ${color}`,
    }}
  />
);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Tokeniser Helper ─────────────────────────────────────────────────────────
function tokenise(text: string): string[] {
  const multiWord = [
    "no cap",
    "hits different",
    "left no crumbs",
    "vibe check",
    "main character",
    "red flag",
    "green flag",
    "touch grass",
    "rent free",
    "ok boomer",
    "send it",
    "understood the assignment",
    "it gives",
    "nah yeah",
    "yeah nah",
    "crash out",
    "fanum tax",
    "side eye",
    "sneaky link",
  ];
  let remaining = text.toLowerCase();
  const found: string[] = [];
  multiWord.forEach((phrase) => {
    if (remaining.includes(phrase)) {
      found.push(phrase);
      remaining = remaining.replace(new RegExp(phrase, "g"), " ");
    }
  });
  const words = remaining.match(/\b[a-z']{2,}\b/g) || [];
  words.forEach((w) => {
    if (!found.includes(w)) found.push(w);
  });
  return found;
}

// ─── MAIN APP COMPONENT ───────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<"Landing" | "Normalizer" | "Sentence Gen" | "Web Crawler" | "Dataset" | "Analytics">("Landing");
  const [normalizerPreload, setNormalizerPreload] = useState<string>("");
  const [sentenceGenPreload, setSentenceGenPreload] = useState<string>("");
  const [dbSize, setDbSize] = useState<number>(DB.size());
  const [newTermsCount, setNewTermsCount] = useState<number>(0);

  useEffect(() => {
    const updateStats = () => {
      setDbSize(DB.size());
      const all = DB.all();
      setNewTermsCount(all.filter((e) => e.isNew).length);
    };
    updateStats();
    return DB.subscribe(updateStats);
  }, []);

  const handleTestInNormalizer = (exampleOrSlang: string) => {
    setNormalizerPreload(exampleOrSlang);
    setPage("Normalizer");
  };

  const handleUseInSentenceGen = (slang: string) => {
    setSentenceGenPreload(slang);
    setPage("Sentence Gen");
  };

  const PAGES = ["Landing", "Normalizer", "Sentence Gen", "Web Crawler", "Dataset", "Analytics"] as const;
  const [appMobileMenuOpen, setAppMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#04040e] text-[#f0f4ff] font-sans selection:bg-cyan-500/30 selection:text-cyan-300 overflow-x-hidden">
      {/* Top Navbar (when in app) */}
      {page !== "Landing" && (
        <nav className="sticky top-0 z-50 bg-[#04040e]/90 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <div
              onClick={() => {
                setPage("Landing");
                setAppMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 relative flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GlitchLogo3D size={36} compact={true} labelId="app-nav-logo" />
              </div>
              <div>
                <div className="flex items-center gap-1 sm:gap-1.5 font-black text-base sm:text-lg tracking-tight text-white">
                  SlangNorm <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">AI</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono -mt-0.5 hidden xs:block">NLP Linguistic Mining</div>
              </div>
            </div>

            {/* Desktop / Tablet Navigation Links */}
            <div className="hidden md:flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
              {PAGES.map((p) => {
                const active = page === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {p === "Landing" && <Globe className="w-3.5 h-3.5" />}
                    {p === "Normalizer" && <Sparkles className="w-3.5 h-3.5" />}
                    {p === "Sentence Gen" && <Smile className="w-3.5 h-3.5" />}
                    {p === "Web Crawler" && <Radio className="w-3.5 h-3.5" />}
                    {p === "Dataset" && <Database className="w-3.5 h-3.5" />}
                    {p === "Analytics" && <TrendingUp className="w-3.5 h-3.5" />}
                    <span>{p === "Landing" ? "Landing" : p}</span>
                    {p === "Web Crawler" && newTermsCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-[#060612] text-[10px] font-black flex items-center justify-center animate-pulse">
                        {newTermsCount > 9 ? "9+" : newTermsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://github.com/Abhay-211/slangnormai"
                target="_blank"
                rel="noreferrer"
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                GitHub
              </a>

              <a
                href="https://www.linkedin.com/in/abhay-chauhan-8937902b9"
                target="_blank"
                rel="noreferrer"
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-sky-300 text-xs font-mono transition-all"
              >
                <ExternalLink className="w-3 h-3 text-sky-400" />
                LinkedIn
              </a>

              <button
                onClick={() => setPage("Landing")}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-cyan-400/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono font-medium transition-all"
              >
                ← Landing
              </button>

              {/* Mobile / Tablet Menu Button */}
              <button
                onClick={() => setAppMobileMenuOpen(!appMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white"
                aria-label="Toggle App Views"
              >
                {appMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown for Phone & Tablet */}
          {appMobileMenuOpen && (
            <div className="md:hidden bg-[#060614] border-b border-white/10 px-4 py-3 space-y-1.5 backdrop-blur-3xl animate-in slide-in-from-top-2">
              {PAGES.map((p) => {
                const active = page === p;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      setAppMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      active
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                        : "text-slate-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {p === "Landing" && <Globe className="w-4 h-4 text-cyan-400" />}
                      {p === "Normalizer" && <Sparkles className="w-4 h-4 text-emerald-400" />}
                      {p === "Sentence Gen" && <Smile className="w-4 h-4 text-violet-400" />}
                      {p === "Web Crawler" && <Radio className="w-4 h-4 text-amber-400" />}
                      {p === "Dataset" && <Database className="w-4 h-4 text-cyan-400" />}
                      {p === "Analytics" && <TrendingUp className="w-4 h-4 text-indigo-400" />}
                      <span>{p === "Landing" ? "Landing Page" : p}</span>
                    </span>
                    {p === "Web Crawler" && newTermsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-[#060612] text-[10px] font-black">
                        {newTermsCount} new
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Phone Quick Horizontal Tab Scroller (Secondary sub-bar for instant switching on mobile) */}
          <div className="md:hidden flex items-center gap-1.5 px-3 py-2 border-t border-white/[0.05] overflow-x-auto no-scrollbar bg-[#04040e]/95">
            {PAGES.filter(p => p !== "Landing").map((p) => {
              const active = page === p;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-all ${
                    active
                      ? "bg-cyan-500 text-[#04040e] font-bold shadow-sm"
                      : "bg-white/[0.03] text-slate-400 border border-white/[0.06]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Pages View */}
      <main>
        {page === "Landing" && (
          <LandingHero
            onStart={() => setPage("Normalizer")}
            onExplore={(targetTab) => setPage(targetTab as any)}
            totalTerms={dbSize}
          />
        )}
        {page === "Web Crawler" && (
          <CrawlerPage
            onTestInNormalizer={handleTestInNormalizer}
            onUseInSentenceGen={handleUseInSentenceGen}
            onNavigateToDataset={() => setPage("Dataset")}
          />
        )}
        {page === "Normalizer" && (
          <NormalizerPage
            preloadedText={normalizerPreload}
            onClearPreload={() => setNormalizerPreload("")}
          />
        )}
        {page === "Sentence Gen" && (
          <SentenceGeneratorPage
            preloadedSlang={sentenceGenPreload}
            onClearPreload={() => setSentenceGenPreload("")}
          />
        )}
        {page === "Dataset" && (
          <DatasetPage
            onTestInNormalizer={handleTestInNormalizer}
            onUseInSentenceGen={handleUseInSentenceGen}
          />
        )}
        {page === "Analytics" && (
          <AnalyticsDashboard
            onTestInNormalizer={handleTestInNormalizer}
            onUseInSentenceGen={handleUseInSentenceGen}
            onExploreCrawler={() => setPage("Web Crawler")}
          />
        )}
      </main>

      {/* Footer (when in app) */}
      {page !== "Landing" && (
        <footer className="border-t border-slate-800/80 py-10 px-4 mt-16 text-xs text-slate-400 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">SlangNorm AI</span>
                <span className="text-cyan-400 font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  v2.4
                </span>
              </div>
              <p className="text-slate-500 max-w-md text-[11px]">
                Real-time Semantic Slang Normalization, Autonomous Web Crawler, Contextual Sentence Synthesizer.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <a
                href="https://github.com/Abhay-211/slangnormai"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                GitHub Repo
              </a>
              <a
                href="https://www.linkedin.com/in/abhay-chauhan-8937902b9"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-sky-300 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                LinkedIn Profile
              </a>
              <button
                onClick={() => setPage("Landing")}
                className="text-cyan-400 hover:underline font-bold"
              >
                View Landing →
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// ─── PAGE 1: Web Crawler (Upgraded with live scraping & new terms feed) ───────
function CrawlerPage({
  onTestInNormalizer,
  onUseInSentenceGen,
  onNavigateToDataset,
}: {
  onTestInNormalizer: (text: string) => void;
  onUseInSentenceGen: (slang: string) => void;
  onNavigateToDataset?: () => void;
}) {
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [sources, setSources] = useState<CrawlSource[]>(() => {
    try {
      const saved = localStorage.getItem("slangnorm_sources");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_SOURCES;
  });

  const [crawling, setCrawling] = useState(false);
  const [crawlLog, setCrawlLog] = useState<{ msg: string; type: string; ts: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [recentCrawlSessionTerms, setRecentCrawlSessionTerms] = useState<SlangEntry[]>([]);
  const [allNewTerms, setAllNewTerms] = useState<SlangEntry[]>([]);

  // Search/Topic Mining Controls
  const [searchTopic, setSearchTopic] = useState("Gen-Z, Brainrot & 2026 Internet Vernacular");
  const [batchCount, setBatchCount] = useState(5);
  const [activeFilterSource, setActiveFilterSource] = useState<string>("all");
  const [newTermsSearch, setNewTermsSearch] = useState("");

  // Custom manual term & custom source modals/inputs
  const [customTerm, setCustomTerm] = useState("");
  const [addingTerm, setAddingTerm] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceCategory, setNewSourceCategory] = useState("community");
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);

  // Sync state with DB
  useEffect(() => {
    const refreshNew = () => {
      const all = DB.all();
      setAllNewTerms(all.filter((e) => e.isNew));
    };
    refreshNew();
    return DB.subscribe(refreshNew);
  }, []);

  const saveSources = (updated: CrawlSource[]) => {
    setSources(updated);
    try {
      localStorage.setItem("slangnorm_sources", JSON.stringify(updated));
    } catch (_) {}
  };

  const toggleSource = (id: string) => {
    const updated = sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    saveSources(updated);
  };

  const handleAddNewSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    const newSrc: CrawlSource = {
      id: "custom_" + Date.now(),
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      category: newSourceCategory,
      color: T.cyan,
      icon: "🌐",
      enabled: true,
      description: "User-defined custom web scraping source",
    };
    saveSources([...sources, newSrc]);
    setNewSourceName("");
    setNewSourceUrl("");
    setShowAddSource(false);
  };

  const handleDeleteSource = (id: string) => {
    const updated = sources.filter((s) => s.id !== id);
    saveSources(updated);
  };

  // ─── Automated Multi-Source Crawler Execution ──────────────────────────────
  const runFullCrawl = async () => {
    const enabledSources = sources.filter((s) => s.enabled);
    if (enabledSources.length === 0) {
      alert("Please enable at least one scraping source.");
      return;
    }

    setCrawling(true);
    setCrawlLog([]);
    setProgress(0);
    setRecentCrawlSessionTerms([]);

    const log = (msg: string, type: "info" | "success" | "warn" | "system" = "info") =>
      setCrawlLog((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);

    log(`🚀 Launching Web Slang Mining Engine (${enabledSources.length} sources enabled)…`, "system");
    await delay(250);

    const existingSlangList = DB.all().map((e) => e.slang);
    let totalAdded = 0;
    const sessionNewlyAdded: SlangEntry[] = [];

    for (let i = 0; i < enabledSources.length; i++) {
      const src = enabledSources[i];
      log(`📡 Crawling [${src.name}] via ${src.url}…`, "info");
      await delay(250);

      try {
        log(`🔍 Querying endpoint for topic "${searchTopic}"…`, "info");
        const scrapedTerms = await crawlSlang({
          sourceName: src.name,
          sourceUrl: src.url,
          topic: searchTopic,
          existingSlang: existingSlangList,
          count: batchCount,
        });

        if (scrapedTerms && Array.isArray(scrapedTerms) && scrapedTerms.length > 0) {
          const batchToAdd: Partial<SlangEntry>[] = [];
          scrapedTerms.forEach((item: any) => {
            if (item.slang && item.meaning) {
              const slangKey = item.slang.toLowerCase().trim();
              if (!DB.peek(slangKey)) {
                const entryData: Partial<SlangEntry> = {
                  slang: item.slang.trim(),
                  meaning: item.meaning,
                  category: item.category || src.category || "other",
                  source: src.name,
                  sourceUrl: src.url,
                  examples: item.examples && item.examples.length > 0 ? item.examples : [`That was totally ${item.slang}!`],
                  exampleTranslation: item.exampleTranslation || item.meaning,
                  isNew: true,
                  addedAt: new Date().toISOString(),
                };
                batchToAdd.push(entryData);
                existingSlangList.push(item.slang.trim());
                sessionNewlyAdded.push(entryData as SlangEntry);
              }
            }
          });

          if (batchToAdd.length > 0) {
            DB.bulkAdd(batchToAdd);
            totalAdded += batchToAdd.length;
            log(
              `✅ Extracted & persisted ${batchToAdd.length} fresh terms from ${src.name} (Live DB: ${DB.size()} terms)`,
              "success"
            );
          } else {
            log(`ℹ No unseen terms from ${src.name} on this pass`, "info");
          }
        } else {
          log(`ℹ No unseen terms from ${src.name} on this pass`, "info");
        }
      } catch (err: any) {
        log(`⚠ Warning on ${src.name}: ${err.message || "Failed extraction"}`, "warn");
      }

      setProgress(Math.round(((i + 1) / enabledSources.length) * 100));
      await delay(300);
    }

    setRecentCrawlSessionTerms(sessionNewlyAdded);
    log(`🎉 Scraping cycle complete! ${totalAdded} fresh slangs added to live database (Now ${DB.size()} terms).`, "system");
    setCrawling(false);
  };

  // ─── Single Instant Topic Mine ─────────────────────────────────────────────
  const runInstantMine = async () => {
    if (!searchTopic.trim()) return;
    setCrawling(true);
    setCrawlLog([]);
    setProgress(20);

    const log = (msg: string, type: "info" | "success" | "warn" | "system" = "info") =>
      setCrawlLog((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);

    log(`⚡ Instant Mining slang for topic: "${searchTopic}"…`, "system");
    await delay(250);

    const existingSlangList = DB.all().map((e) => e.slang);

    try {
      setProgress(50);
      const scraped = await crawlSlang({
        sourceName: "Live Topic Hunter",
        sourceUrl: "https://urbandictionary.com",
        topic: searchTopic,
        existingSlang: existingSlangList,
        count: batchCount,
      });

      const sessionTerms: SlangEntry[] = [];
      const batchToAdd: Partial<SlangEntry>[] = [];

      if (Array.isArray(scraped)) {
        scraped.forEach((item: any) => {
          if (item.slang && item.meaning) {
            const slangKey = item.slang.toLowerCase().trim();
            if (!DB.peek(slangKey)) {
              const entryData: Partial<SlangEntry> = {
                slang: item.slang.trim(),
                meaning: item.meaning,
                category: item.category || "internet-culture",
                source: `Topic: ${searchTopic}`,
                sourceUrl: item.sourceUrl || "https://knowyourmeme.com",
                examples: item.examples && item.examples.length > 0 ? item.examples : [`Everyone is using ${item.slang} rn.`],
                exampleTranslation: item.exampleTranslation || item.meaning,
                isNew: true,
                addedAt: new Date().toISOString(),
              };
              batchToAdd.push(entryData);
              sessionTerms.push(entryData as SlangEntry);
              existingSlangList.push(item.slang.trim());
            }
          }
        });
      }

      if (batchToAdd.length > 0) {
        DB.bulkAdd(batchToAdd);
      }

      setProgress(100);
      setRecentCrawlSessionTerms(sessionTerms);
      log(`✅ Successfully mined and registered ${batchToAdd.length} new expressions into database! (Live DB: ${DB.size()} terms)`, "success");
    } catch (err: any) {
      log(`❌ Mining failed: ${err.message}`, "warn");
    } finally {
      setCrawling(false);
    }
  };

  // ─── Manual Term Add ───────────────────────────────────────────────────────
  const handleAddCustomTerm = async () => {
    if (!customTerm.trim()) return;
    setAddingTerm(true);
    try {
      const raw = await callAI(
        "You are a slang dictionary. Return strictly valid JSON.",
        `Define this slang term: "${customTerm}". Return JSON: {"meaning":"concise definition under 8 words","category":"category","examples":["example sentence with the slang"],"exampleTranslation":"formal standard English translation"}`
      );
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      DB.set(customTerm, {
        meaning: parsed.meaning || "Informal expression",
        category: parsed.category || "other",
        source: "Manual User Input",
        sourceUrl: "https://urbandictionary.com",
        examples: parsed.examples || [`He said ${customTerm} during the stream.`],
        exampleTranslation: parsed.exampleTranslation || parsed.meaning,
        isNew: true,
        addedAt: new Date().toISOString(),
      });

      setCustomTerm("");
    } catch (err) {
      console.error("Failed to add custom term:", err);
    } finally {
      setAddingTerm(false);
    }
  };

  const copyTerm = (term: string) => {
    navigator.clipboard.writeText(term);
    setCopiedTerm(term);
    setTimeout(() => setCopiedTerm(null), 1500);
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allNewTerms, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `slangnorm_new_terms_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter newly added terms
  const displayNewTerms = allNewTerms.filter((term) => {
    const matchesSearch =
      !newTermsSearch ||
      term.slang.toLowerCase().includes(newTermsSearch.toLowerCase()) ||
      term.meaning.toLowerCase().includes(newTermsSearch.toLowerCase()) ||
      term.category.toLowerCase().includes(newTermsSearch.toLowerCase());
    const matchesSource = activeFilterSource === "all" || term.source === activeFilterSource;
    return matchesSearch && matchesSource;
  });

  const uniqueSources = Array.from(new Set(allNewTerms.map((t) => t.source)));

  const TOPIC_PRESETS = [
    { label: "🔥 2026 Viral Trends", value: "Viral TikTok, Reels & Gen-Z trends" },
    { label: "🧠 Brainrot & Memes", value: "Skibidi, mewing, fanum tax, aura, and modern memes" },
    { label: "🎮 Gaming & Esports", value: "Twitch streaming, Discord and competitive gaming slang" },
    { label: "🇬🇧 UK Drill & Roadman", value: "London drill music, roadman vernacular and slang" },
    { label: "🇦🇺 Aussie Slang", value: "Australian colloquialisms, beach and pub slang" },
    { label: "💼 Corporate & Office", value: "Funny corporate buzzwords and office slang" },
    { label: "🇮🇳 Desi & Hinglish", value: "Hinglish modern slang, jugaad, and urban expressions" },
    { label: "✨ Stan & Pop Culture", value: "X / Twitter stan neologisms, fandoms, and aesthetic slang" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge color={T.cyan}>Live Scraping & Extraction</Badge>
            <Badge color={T.emerald}>Auto-Database Sync</Badge>
            <Badge color={T.indigo}>Zero-Duplicate Guaranteed</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
            AI Slang Web Crawler & Data Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Continuously crawl web sources, social communities, and niche vernaculars. New slang is
            automatically synthesized, validated with examples and formal definitions, and synchronized into your live database.
          </p>
        </div>

        {/* Quick Action Badges & Cloud DB Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">Live DB Slangs</div>
              <div className="text-lg font-black text-cyan-300 font-mono">{DB.size()}</div>
            </div>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">New Unreviewed</div>
              <div className="text-lg font-black text-amber-300 font-mono">{allNewTerms.length}</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={async () => {
                setIsSyncingDb(true);
                await DB.syncWithServer();
                setIsSyncingDb(false);
              }}
              disabled={isSyncingDb}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              title="Force sync database with cloud & disk storage"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingDb ? "animate-spin" : ""}`} />
              <span>{isSyncingDb ? "Syncing..." : "Sync DB"}</span>
            </button>

            {onNavigateToDataset && (
              <button
                onClick={onNavigateToDataset}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                title="View all records in the live dataset"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dataset ({DB.size()}) →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Crawler Controls & Source Management (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Target Topic & Mining Controls */}
          <Card glow={T.cyan}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Crawler Mining Target
              </span>
              <Badge color={T.cyan}>NLP Search</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5 font-bold">
                  Target Topic / Subculture Niche
                </label>
                <input
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="e.g. UK Drill, Brainrot, Gaming, Gen-Z trends..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-medium"
                />
              </div>

              {/* Presets */}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1.5 font-semibold">
                  Quick Subculture Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSearchTopic(p.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all font-medium ${
                        searchTopic === p.value
                          ? "bg-cyan-500/20 border border-cyan-400 text-cyan-200"
                          : "bg-white/[0.03] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch Size Slider */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
                  <span>Batch Extraction Count</span>
                  <span className="text-cyan-400 font-bold">{batchCount} terms per source</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={runInstantMine}
                  disabled={crawling || !searchTopic.trim()}
                  className="py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Instant Topic Mine
                </button>

                <button
                  onClick={runFullCrawl}
                  disabled={crawling}
                  className="py-3 px-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  style={{
                    background: crawling
                      ? "rgba(6,182,212,0.3)"
                      : "linear-gradient(135deg,#06b6d4,#6366f1)",
                  }}
                >
                  {crawling ? <Spinner color="#fff" size={14} /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  {crawling ? "Crawling…" : "Execute Full Crawl"}
                </button>
              </div>

              {crawling && (
                <div className="mt-2 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl">
                  <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                    <span className="flex items-center gap-2">
                      <Spinner size={12} color="#06b6d4" />
                      Crawling & Syncing Database…
                    </span>
                    <span className="font-bold text-cyan-400">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Configurable Scraping Sources */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Scraping Source Links ({sources.filter((s) => s.enabled).length}/{sources.length})
              </span>
              <button
                onClick={() => setShowAddSource(!showAddSource)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddSource ? "Cancel" : "Add Source"}
              </button>
            </div>

            {/* Add Custom Source Form */}
            {showAddSource && (
              <div className="p-3 mb-3 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-cyan-300">Add New Scrape Source Link</div>
                <input
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="Source Name (e.g. Discord Gaming Corpus)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
                <input
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="Website URL (e.g. https://discord.com)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                />
                <div className="flex justify-between items-center pt-1">
                  <select
                    value={newSourceCategory}
                    onChange={(e) => setNewSourceCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300"
                  >
                    <option value="social">Social Media</option>
                    <option value="gaming">Gaming</option>
                    <option value="regional">Regional</option>
                    <option value="community">Community Forum</option>
                    <option value="crowdsourced">Dictionary</option>
                  </select>
                  <button
                    onClick={handleAddNewSource}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold"
                  >
                    Save Source
                  </button>
                </div>
              </div>
            )}

            {/* Sources List */}
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    src.enabled
                      ? "bg-slate-900/60 border-slate-800"
                      : "bg-slate-950/40 border-slate-900 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={src.enabled}
                      onChange={() => toggleSource(src.id)}
                      className="accent-cyan-500 rounded cursor-pointer w-4 h-4"
                    />
                    <span className="text-base">{src.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">{src.name}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open target URL"
                          className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{src.url}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge color={src.color}>{src.category}</Badge>
                    {src.id.startsWith("custom_") && (
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="text-slate-600 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Manual Slang Injector */}
          <Card>
            <div className="font-bold text-sm text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Direct Entity Injector
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Instant AI Lookup</span>
            </div>
            <div className="flex gap-2">
              <input
                value={customTerm}
                onChange={(e) => setCustomTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomTerm()}
                placeholder="Type slang to add (e.g. delulu, rizzler, skibidi)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handleAddCustomTerm}
                disabled={addingTerm || !customTerm.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 shrink-0"
              >
                {addingTerm ? <Spinner size={12} /> : <Plus className="w-3.5 h-3.5" />}
                Add Term
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Newly Discovered Slang Feed & Live Log (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Real-time Discovered Slang Feed Banner */}
          <Card glow={allNewTerms.length > 0 ? T.emerald : undefined} className="flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    Newly Discovered Slang Feed
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {displayNewTerms.length} terms
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Slangs mined by the crawler, cataloged with meanings, examples, and translations.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {allNewTerms.length > 0 && (
                  <>
                    <button
                      onClick={handleExportJSON}
                      className="px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1 font-semibold transition-all"
                      title="Export new slang as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button
                      onClick={() => DB.clearNewFlags()}
                      className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1 font-semibold transition-all"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Mark Reviewed
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filter & Search Bar for New Terms */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={newTermsSearch}
                  onChange={(e) => setNewTermsSearch(e.target.value)}
                  placeholder="Filter new terms by word, category, or meaning..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {uniqueSources.length > 1 && (
                <select
                  value={activeFilterSource}
                  onChange={(e) => setActiveFilterSource(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                >
                  <option value="all">All Sources ({allNewTerms.length})</option>
                  {uniqueSources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* New Terms Cards Feed */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {displayNewTerms.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-slate-800 flex items-center justify-center mb-3">
                    <Radio className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-400">No new slang entries to display</div>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Click "Execute Full Crawl" or "Instant Topic Mine" on the left to start scraping and discovering fresh slang terms!
                  </p>
                </div>
              ) : (
                displayNewTerms.map((entry) => (
                  <div
                    key={entry.slang}
                    className="p-4 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-lg text-amber-300 tracking-tight">
                          {entry.slang}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <PulsingDot color={T.emerald} />
                          Discovered
                        </span>
                        <Badge color={T.indigo}>{entry.category}</Badge>
                      </div>

                      {/* Source Link */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {entry.sourceUrl ? (
                          <a
                            href={entry.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {entry.source}
                          </a>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {entry.source}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Definition */}
                    <div className="text-sm text-slate-100 font-medium mb-3 leading-relaxed">
                      <span className="text-slate-400 font-normal">Formal Meaning: </span>
                      {entry.meaning}
                    </div>

                    {/* Example & Translation */}
                    {entry.examples && entry.examples.length > 0 && (
                      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl mb-3 text-xs space-y-1.5">
                        <div className="text-amber-200/90 italic font-sans flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">“</span>
                          <span>{entry.examples[0]}</span>
                          <span className="text-amber-400 font-bold">”</span>
                        </div>
                        {entry.exampleTranslation && (
                          <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-900 flex items-center gap-1.5">
                            <span className="text-indigo-400 font-bold uppercase text-[9px] tracking-wider">
                              Translation:
                            </span>
                            <span>{entry.exampleTranslation}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Cross-App Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            onTestInNormalizer(
                              entry.examples?.[0] || `ngl that is totally ${entry.slang} no cap`
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                        >
                          <Zap className="w-3 h-3 text-cyan-400" />
                          Test in Normalizer →
                        </button>

                        <button
                          onClick={() => onUseInSentenceGen(entry.slang)}
                          className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                        >
                          <Smile className="w-3 h-3 text-violet-400" />
                          Generate Sentences ✦
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyTerm(entry.slang)}
                          className="p-1.5 text-slate-400 hover:text-white bg-white/[0.04] rounded-lg transition-colors"
                          title="Copy slang word"
                        >
                          {copiedTerm === entry.slang ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => DB.delete(entry.slang)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 bg-white/[0.04] rounded-lg transition-colors"
                          title="Delete from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Live Terminal Log */}
          <Card>
            <div className="font-bold text-sm text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Crawler Ingestion Stream Console
              </span>
              {crawling && <Badge color={T.emerald}>Active Pipeline</Badge>}
            </div>

            <div className="h-44 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-3 font-mono text-xs space-y-1.5">
              {crawlLog.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600">
                  Ready. Click "Execute Full Crawl" or "Instant Topic Mine" to start scraping.
                </div>
              ) : (
                crawlLog.map((l, i) => (
                  <div
                    key={i}
                    className={`${
                      l.type === "success"
                        ? "text-emerald-400"
                        : l.type === "warn"
                        ? "text-amber-400"
                        : l.type === "system"
                        ? "text-cyan-400 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-600">[{l.ts}] </span>
                    {l.msg}
                  </div>
                ))
              )}
            </div>

            {recentCrawlSessionTerms.length > 0 && onNavigateToDataset && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  +{recentCrawlSessionTerms.length} terms persisted to database
                </span>
                <button
                  onClick={onNavigateToDataset}
                  className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1"
                >
                  View all {DB.size()} in Dataset →
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2: Normalizer ───────────────────────────────────────────────────────
function NormalizerPage({
  preloadedText = "",
  onClearPreload,
}: {
  preloadedText?: string;
  onClearPreload?: () => void;
}) {
  const [input, setInput] = useState(preloadedText || "");
  const [result, setResult] = useState<NormalizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedOutput, setCopiedOutput] = useState(false);

  useEffect(() => {
    if (preloadedText) {
      setInput(preloadedText);
      if (onClearPreload) onClearPreload();
    }
  }, [preloadedText]);

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
    setLoading(true);
    setResult(null);

    try {
      setStage(STAGES[0]);
      const tokens = tokenise(input);
      const unknowns = tokens.filter((t) => !DB.peek(t) && t.length > 1);

      setStage(STAGES[1]);
      await delay(250);

      if (unknowns.length > 0) {
        setStage(STAGES[2]);
        const batchPrompt = `You are an expert slang dictionary API. For each slang term below, return ONLY a valid JSON array in this exact format:
[{"slang":"term","meaning":"concise definition under 8 words","category":"emotion|evaluation|trait|status|action|other"}]

Terms to look up: ${unknowns.slice(0, 10).join(", ")}`;

        try {
          const raw = await callAI(
            "You are a specialized slang dictionary API. Return strictly valid JSON arrays.",
            batchPrompt,
            600
          );
          const cleaned = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.slang && item.meaning) {
                DB.set(item.slang, {
                  meaning: item.meaning,
                  category: item.category || "other",
                  source: "AI Live Lookup",
                });
              }
            });
          }
        } catch (apiErr) {
          console.warn("AI lookup fallback notice:", apiErr);
        }
      }

      setStage(STAGES[3]);
      const detections: Detection[] = [];
      let output = input;

      const multiWord: [string, string][] = [
        ["no cap", "no lie, for real"],
        ["hits different", "feels uniquely special"],
        ["left no crumbs", "executed flawlessly"],
        ["vibe check", "assessing energy or mood"],
        ["main character", "acting like the protagonist"],
        ["touch grass", "go outside and ground yourself"],
        ["rent free", "constantly occupying one's thoughts"],
        ["understood the assignment", "performed perfectly"],
        ["crash out", "lose temper violently"],
        ["fanum tax", "taking someone's food playfully"],
      ];

      multiWord.forEach(([phrase, def]) => {
        if (output.toLowerCase().includes(phrase)) {
          const entry = DB.get(phrase) || { meaning: def, category: "phrase", source: "dictionary" };
          if (!detections.find((d) => d.slang === phrase)) {
            detections.push({
              slang: phrase,
              meaning: entry.meaning,
              category: "phrase",
              source: entry.source || "cached",
            });
          }
          output = output.replace(
            new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
            entry.meaning
          );
        }
      });

      const wordBoundary = output.split(/(\b)/);
      const rebuilt = wordBoundary.map((tok) => {
        const key = tok.toLowerCase().replace(/[^a-z']/g, "");
        const entry = DB.get(key);
        if (entry && entry.meaning && !detections.find((d) => d.slang === key)) {
          detections.push({
            slang: key,
            meaning: entry.meaning,
            category: entry.category || "other",
            source: entry.source || "cached",
          });
          return entry.meaning;
        }
        return tok;
      });
      output = rebuilt.join("");

      DB.incrementNormalization();
      setStage(STAGES[4]);

      const score = Math.min(
        100,
        Math.round(
          (detections.length / Math.max(input.split(/\s+/).length, 1)) * 100 * 2.5 +
            (detections.length > 0 ? 15 : 0)
        )
      );

      const resObj: NormalizerResult = {
        normalized: output,
        detections,
        score,
        originalInput: input,
      };

      setResult(resObj);
      setHistory((h) => [
        { input, output, detections, score, ts: new Date().toLocaleTimeString() },
        ...h.slice(0, 5),
      ]);
    } catch (err: any) {
      setResult({
        normalized: "",
        detections: [],
        score: 0,
        originalInput: input,
        error: err.message || "Failed to normalize text",
      });
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const copyOutput = () => {
    if (result?.normalized) {
      navigator.clipboard.writeText(result.normalized);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 1600);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            AI Slang Normalizer
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Detects colloquialisms, internet slang, and Gen-Z terms and translates them into formal standard English.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-cyan-300">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>{DB.size()} Cached Lexicon Terms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <Card glow={T.cyan} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Raw Input Text
              </span>
              <Badge color={T.cyan}>NLP Engine</Badge>
            </div>

            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setResult(null);
              }}
              placeholder="Paste or type internet speak, Gen-Z slang, abbreviations (e.g., 'ngl this bussin fr no cap')..."
              className="w-full min-h-[170px] bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-slate-100 text-sm p-4 resize-y outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 leading-relaxed font-sans transition-all"
            />

            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-slate-500 font-mono">{input.length} characters</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInput("");
                    setResult(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-slate-700/60 rounded-lg transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={normalise}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                  style={{
                    background:
                      loading || !input.trim()
                        ? "rgba(6,182,212,0.3)"
                        : "linear-gradient(135deg,#06b6d4,#0ea5e9)",
                  }}
                >
                  {loading ? <Spinner color="#fff" size={14} /> : <ArrowRight className="w-3.5 h-3.5" />}
                  {loading ? stage || "Analyzing…" : "Normalize Text"}
                </button>
              </div>
            </div>

            {loading && (
              <div className="mt-4 p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 mb-2 font-bold">
                  Active Pipeline Sequence
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {STAGES.map((s, i) => {
                    const isActive = stage === s;
                    const isDone = STAGES.indexOf(stage) > i;
                    return (
                      <div key={s} className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`w-2 h-2 rounded-full transition-colors ${
                            isActive
                              ? "bg-cyan-400 animate-ping"
                              : isDone
                              ? "bg-emerald-400"
                              : "bg-slate-700"
                          }`}
                        />
                        <span
                          className={`font-mono text-[11px] ${
                            isActive
                              ? "text-cyan-300 font-bold"
                              : isDone
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }`}
                        >
                          {s}
                        </span>
                        {i < STAGES.length - 1 && <span className="text-slate-600">›</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Sample Sentences
              </div>
              <div className="flex flex-col gap-1.5">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(ex);
                      setResult(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">"{ex}"</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <Card glow={result && !result.error ? T.emerald : undefined} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Normalized Output
              </span>
              {result && !result.error && (
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Slang Density: {result.score}%
                </span>
              )}
            </div>

            {result?.error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
                ⚠ {result.error}
              </div>
            ) : result ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-slate-100 text-sm leading-relaxed min-h-[100px] select-text">
                  {result.normalized}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={copyOutput}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
                  >
                    {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedOutput ? "Copied to Clipboard" : "Copy Output"}
                  </button>
                  <span className="text-xs text-slate-500 font-mono">
                    {result.detections.length} terms transformed
                  </span>
                </div>

                {result.detections.length > 0 ? (
                  <div className="mt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Detected Slang Entities ({result.detections.length})
                    </div>
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {result.detections.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">{d.slang}</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-slate-300">{d.meaning}</span>
                          </div>
                          <Badge color={T.cyan}>{d.source}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center font-medium">
                    ✓ Clean text — no informal slang detected.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-slate-800 flex items-center justify-center mb-3">
                  <Terminal className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-sm">Enter informal slang text on the left and run normalization</p>
              </div>
            )}
          </Card>

          {history.length > 0 && (
            <Card>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Recent Normalizations</span>
                <span className="font-mono text-slate-500">{history.length} items</span>
              </div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setInput(h.input);
                      setResult({
                        normalized: h.output,
                        detections: h.detections,
                        score: h.score,
                        originalInput: h.input,
                      });
                    }}
                    className="p-2.5 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-all"
                  >
                    <div className="text-xs font-mono text-slate-300 truncate">"{h.input}"</div>
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                      <span>{h.detections.length} terms transformed · {h.score}% density</span>
                      <span className="font-mono">{h.ts}</span>
                    </div>
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

// ─── PAGE 3: Sentence Generator ───────────────────────────────────────────────
function SentenceGeneratorPage({
  preloadedSlang = "",
  onClearPreload,
}: {
  preloadedSlang?: string;
  onClearPreload?: () => void;
}) {
  const [slangs, setSlangs] = useState(preloadedSlang || "");
  const [context, setContext] = useState("casual conversation");
  const [style, setStyle] = useState("Gen-Z");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedSentence[] | { error: string } | null>(null);
  const [count, setCount] = useState(3);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (preloadedSlang) {
      setSlangs(preloadedSlang);
      if (onClearPreload) onClearPreload();
    }
  }, [preloadedSlang]);

  const CONTEXTS = [
    "casual conversation",
    "social media post",
    "text message",
    "group chat",
    "storytelling",
    "gaming squad",
  ];
  const STYLES = ["Gen-Z", "AAVE", "British slang", "Internet culture", "Mixed / Global"];

  const POPULAR_SLANG_PRESETS = [
    "rizz, bussin",
    "touch grass",
    "crash out",
    "delulu, main character",
    "proper, innit",
    "chuffed",
    "ate and left no crumbs",
    "skibidi, fanum tax",
    "glow up",
    "aura points",
  ];

  const handleRandomPreset = () => {
    const all = DB.all();
    if (all.length > 1) {
      const idx1 = Math.floor(Math.random() * all.length);
      const idx2 = (idx1 + Math.floor(Math.random() * (all.length - 1)) + 1) % all.length;
      setSlangs(`${all[idx1].slang}, ${all[idx2].slang}`);
    }
  };

  const generate = async () => {
    if (!slangs.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const prompt = `Generate ${count} authentic, contextually accurate sentences using these slang terms: "${slangs}".

Context scenario: ${context}
Dialect / tone: ${style}

Rules:
- Must sound natural to native slang speakers, never forced
- The sentences MUST actually include the target slang terms: "${slangs}"
- Include formal translations for each sentence
- Return ONLY a valid JSON array:
[
  {
    "sentence": "authentic sentence with the slang",
    "slangs_used": ["term1", "term2"],
    "translation": "clear formal equivalent"
  }
]`;

      let sentences: GeneratedSentence[] = [];

      try {
        const raw = await callAI(
          "You are an expert creative linguist specializing in authentic Gen-Z and modern internet vernacular. Return strictly valid JSON arrays.",
          prompt,
          1000
        );

        if (raw && raw.trim() !== "" && raw.trim() !== "[]") {
          const cleaned = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const requestedTerms = extractSlangTerms(slangs);
            // Verify output specifically contains requested keywords
            const isValid = parsed.some((p: any) =>
              requestedTerms.some(
                (term) =>
                  p.sentence?.toLowerCase().includes(term.toLowerCase()) ||
                  p.slangs_used?.some((su: string) => su.toLowerCase().includes(term.toLowerCase()))
              )
            );
            if (isValid) {
              sentences = parsed;
            }
          }
        }
      } catch (aiErr) {
        console.warn("AI generation fallback to deterministic linguistic engine:", aiErr);
      }

      // If AI is unavailable or didn't use the requested terms, use our dedicated linguistic engine
      if (!sentences || sentences.length === 0) {
        sentences = generateDynamicSentences(slangs, context, style, count);
      }

      setResult(
        sentences.length > 0
          ? sentences
          : { error: "Could not generate sentences for the provided slang terms" }
      );
    } catch (err: any) {
      const fallback = generateDynamicSentences(slangs, context, style, count);
      setResult(
        fallback.length > 0
          ? fallback
          : { error: err.message || "Failed to generate sentences" }
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-violet-400" />
          Slang Sentence Generator
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Provide slang terms to synthesize natural, context-aware sentences with dialect accuracy and formal translations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card glow={T.violet} className="flex flex-col gap-5">
            <div className="font-bold text-sm text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                Generation Parameters
              </span>
              <button
                type="button"
                onClick={handleRandomPreset}
                className="text-xs text-violet-300 hover:text-violet-100 flex items-center gap-1 bg-violet-950/60 hover:bg-violet-900/60 px-2.5 py-1 rounded-lg border border-violet-500/30 transition-colors"
                title="Randomly pick slang terms from database"
              >
                <Sparkles className="w-3 h-3 text-violet-400" />
                Random Pair
              </button>
            </div>

            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-slate-400 block mb-2 font-bold">
                Target Slang Keywords
              </label>
              <textarea
                value={slangs}
                onChange={(e) => setSlangs(e.target.value)}
                placeholder="e.g. rizz, slay, bussin, no cap, crash out..."
                className="w-full h-20 bg-violet-950/20 border border-violet-500/30 rounded-xl text-slate-100 text-sm p-3.5 resize-none outline-none focus:border-violet-400 font-sans"
              />

              {/* Quick Slang Presets */}
              <div className="mt-2.5">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-1.5 font-semibold">
                  Quick Term Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SLANG_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSlangs(preset)}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all ${
                        slangs === preset
                          ? "bg-violet-500 text-white font-bold"
                          : "bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border border-slate-800"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-slate-400 block mb-2 font-bold">
                Context / Scenario
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setContext(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all font-medium ${
                      context === c
                        ? "bg-violet-600/30 border border-violet-400 text-violet-200"
                        : "bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-slate-400 block mb-2 font-bold">
                Dialect / Style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all font-medium ${
                      style === s
                        ? "bg-violet-600/30 border border-violet-400 text-violet-200"
                        : "bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                <span>Output Variations</span>
                <span className="text-violet-400 font-bold">{count} Sentences</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading || !slangs.trim()}
              className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
              style={{
                background:
                  loading || !slangs.trim()
                    ? "rgba(139,92,246,0.3)"
                    : "linear-gradient(135deg,#8b5cf6,#6366f1)",
              }}
            >
              {loading ? <Spinner color="#fff" size={16} /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Synthesizing Vernacular…" : "Generate Sentences"}
            </button>
          </Card>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4">
          {result && "error" in result ? (
            <Card>
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
                ⚠ {result.error}
              </div>
            </Card>
          ) : Array.isArray(result) && result.length > 0 ? (
            result.map((item, i) => (
              <Card key={i} glow={T.violet} className="relative group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[11px] uppercase font-mono tracking-wider text-violet-400 font-bold mb-2">
                      Generated Sentence {i + 1}
                    </div>
                    <div className="text-base text-slate-100 font-medium leading-relaxed mb-3">
                      "{item.sentence}"
                    </div>

                    {item.slangs_used?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {item.slangs_used.map((s) => (
                          <Badge key={s} color={T.amber}>
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {item.translation && (
                      <div className="p-3 bg-slate-900/60 border-l-2 border-violet-500 rounded-r-lg text-xs text-slate-300">
                        <span className="text-violet-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                          Formal Translation
                        </span>
                        {item.translation}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => copy(item.sentence, i)}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shrink-0"
                    title="Copy sentence"
                  >
                    {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-slate-800 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-sm">Configure target slang keywords on the left and generate sentences</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 4: Dataset ──────────────────────────────────────────────────────────
function DatasetPage({
  onTestInNormalizer,
  onUseInSentenceGen,
}: {
  onTestInNormalizer: (text: string) => void;
  onUseInSentenceGen: (slang: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<SlangEntry[]>([]);
  const [sortBy, setSortBy] = useState<"lookups" | "alpha" | "recent">("recent");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setEntries(DB.all());
    // Auto-sync with server on mount to ensure fresh state
    DB.syncWithServer().then(() => setEntries(DB.all()));
    return DB.subscribe(() => setEntries(DB.all()));
  }, []);

  const categories = ["all", ...Array.from(new Set(entries.map((e) => e.category || "other")))];

  const filtered = entries
    .filter((e) => {
      const matchesSearch =
        !search ||
        e.slang.toLowerCase().includes(search.toLowerCase()) ||
        e.meaning?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase()) ||
        e.source?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "lookups") return (b.lookups || 0) - (a.lookups || 0);
      if (sortBy === "alpha") return a.slang.localeCompare(b.slang);
      return (b.addedAt || "").localeCompare(a.addedAt || "");
    });

  const getSourceColor = (src: string) => {
    if (src.includes("TikTok") || src.includes("Reels")) return T.rose;
    if (src.includes("Reddit") || src.includes("GenZ")) return T.sky;
    if (src.includes("Twitch") || src.includes("Gaming")) return T.violet;
    if (src.includes("Urban")) return T.amber;
    if (src.includes("Know Your Meme")) return T.emerald;
    if (src.includes("UK Drill") || src.includes("British")) return T.indigo;
    if (src.includes("Australian") || src.includes("Aussie")) return T.teal;
    return T.cyan;
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Syncing with cloud database...");
    const res = await DB.syncWithServer();
    setIsSyncing(false);
    if (res.success) {
      setSyncStatusMsg(`Successfully synced ${res.count} cloud terms!`);
    } else {
      setSyncStatusMsg("Operating in local resilient cache mode.");
    }
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleRestoreLexicon = () => {
    const count = DB.restoreAndMergeMasterLexicon();
    setSyncStatusMsg(`Restored & merged ${count} terms from master lexicon!`);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `slangnorm_lexicon_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            Live Slang Lexicon Database
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time dictionary dataset containing <span className="text-cyan-300 font-bold font-mono">{entries.length}</span> validated terms with multi-source persistence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {syncStatusMsg && (
            <span className="text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-mono animate-in fade-in">
              {syncStatusMsg}
            </span>
          )}

          <button
            onClick={handleSyncCloud}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Sync with cloud database server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Cloud DB"}
          </button>

          <button
            onClick={handleRestoreLexicon}
            className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Restore and merge the comprehensive 45+ slang catalog"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Restore Master Lexicon
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Download database as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <Badge color={T.emerald} className="px-3 py-1.5 text-xs font-mono">
            {entries.length} Total Records
          </Badge>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-cyan-500 text-[#060612] font-bold shadow-md shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat === "all" ? `All Categories (${entries.length})` : cat}
          </button>
        ))}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search slang term, definition, category, or source..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortBy === "recent" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Recently Added
          </button>
          <button
            onClick={() => setSortBy("lookups")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortBy === "lookups" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            By Popularity
          </button>
          <button
            onClick={() => setSortBy("alpha")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortBy === "alpha" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            A–Z
          </button>
        </div>
      </div>

      {/* Database Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Slang Term</th>
                <th className="px-5 py-3.5 font-semibold">Formal Definition</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Origin Source</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <p>No matching slang terms found for "{search}"</p>
                      <button
                        onClick={() => {
                          setSearch("");
                          setSelectedCategory("all");
                        }}
                        className="px-3 py-1.5 text-xs text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 rounded-lg hover:bg-cyan-900/40 transition-colors"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.slang} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{item.slang}</span>
                        {item.isNew && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Recently mined" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 max-w-xs">
                      <div>{item.meaning || "—"}</div>
                      {item.examples && item.examples.length > 0 && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                          "{item.examples[0]}"
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge color={T.indigo}>{item.category || "general"}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:underline text-cyan-400"
                        >
                          {item.source}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <Badge color={getSourceColor(item.source)}>{item.source}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onTestInNormalizer(`That was totally ${item.slang}`)}
                          className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold transition-colors"
                        >
                          Normalize
                        </button>
                        <button
                          onClick={() => onUseInSentenceGen(item.slang)}
                          className="px-2 py-1 rounded bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-semibold transition-colors"
                        >
                          Sentence
                        </button>
                        <button
                          onClick={() => DB.delete(item.slang)}
                          className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                          title="Delete term"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Page migrated to /src/components/AnalyticsDashboard.tsx ──────
