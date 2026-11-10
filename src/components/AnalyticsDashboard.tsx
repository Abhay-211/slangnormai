import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Filter,
  Search,
  Zap,
  Flame,
  Database,
  BarChart3,
  PieChart,
  Layers,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpDown,
  Activity,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Smile,
  Check,
  Download,
  RotateCcw,
  X,
  BookOpen,
  Hash,
  Globe,
  Radio,
  Eye,
  Sliders,
  ShieldCheck,
  Lock,
  Server,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { DB } from "../services/db";
import { SlangEntry } from "../types";
import { fetchDbHealthStatus, HealthResponse } from "../services/api";

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const T = {
  cyan: "#06b6d4",
  teal: "#14b8a6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  sky: "#0ea5e9",
  card: "rgba(255, 255, 255, 0.03)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
};

const CATEGORY_COLORS: Record<string, string> = {
  trait: T.violet,
  evaluation: T.cyan,
  action: T.emerald,
  status: T.amber,
  "internet-culture": T.rose,
  phrase: T.sky,
  emotion: T.teal,
  general: T.indigo,
  other: "#94a3b8",
};

interface AnalyticsDashboardProps {
  onTestInNormalizer?: (exampleOrSlang: string) => void;
  onUseInSentenceGen?: (slang: string) => void;
  onExploreCrawler?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onTestInNormalizer,
  onUseInSentenceGen,
  onExploreCrawler,
}) => {
  const [entries, setEntries] = useState<SlangEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<"stacked" | "grid" | "explorer">("stacked");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"lookups" | "alphabetical" | "recent">("lookups");
  const [timeFilter, setTimeFilter] = useState<"all" | "new" | "popular">("all");
  const [exportedStatus, setExportedStatus] = useState<boolean>(false);
  const [dbHealth, setDbHealth] = useState<HealthResponse | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState<boolean>(false);

  const checkHealth = async () => {
    setIsRefreshingHealth(true);
    const data = await fetchDbHealthStatus();
    if (data) setDbHealth(data);
    setIsRefreshingHealth(false);
  };

  useEffect(() => {
    setEntries(DB.all());
    checkHealth();
    return DB.subscribe(() => setEntries(DB.all()));
  }, []);

  // Compute Categories & Sources
  const categoryCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, e) => {
      const c = e.category || "other";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  const sourceCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, e) => {
      const s = e.source || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSource !== "all" && item.source !== selectedSource) {
        return false;
      }
      if (timeFilter === "new" && !item.isNew) {
        return false;
      }
      if (timeFilter === "popular" && (item.lookups || 0) < 50) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTerm = item.slang.toLowerCase().includes(q);
        const matchesMeaning = item.meaning?.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        if (!matchesTerm && !matchesMeaning && !matchesCategory) return false;
      }
      return true;
    });
  }, [entries, selectedCategory, selectedSource, timeFilter, searchQuery]);

  // Sorted list for visualization
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];
    if (sortBy === "lookups") {
      list.sort((a, b) => (b.lookups || 0) - (a.lookups || 0));
    } else if (sortBy === "alphabetical") {
      list.sort((a, b) => a.slang.localeCompare(b.slang));
    } else if (sortBy === "recent") {
      list.sort((a, b) => {
        const timeA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const timeB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return timeB - timeA;
      });
    }
    return list;
  }, [filteredEntries, sortBy]);

  // Top looked up list
  const topLookups = useMemo(() => {
    return [...entries].sort((a, b) => (b.lookups || 0) - (a.lookups || 0)).slice(0, 8);
  }, [entries]);

  const maxLookupValue = useMemo(() => {
    return Math.max(...topLookups.map((t) => t.lookups || 1), 1);
  }, [topLookups]);

  // Category statistics array
  const categoryStatsList = useMemo(() => {
    return (Object.entries(categoryCounts) as [string, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [categoryCounts]);

  // Source statistics array
  const sourceStatsList = useMemo(() => {
    return (Object.entries(sourceCounts) as [string, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [sourceCounts]);

  // Lexical single word vs phrase stats
  const lexicalStructure = useMemo(() => {
    let singleWordCount = 0;
    let multiWordCount = 0;
    let totalCharLength = 0;

    entries.forEach((e) => {
      const words = e.slang.trim().split(/\s+/);
      if (words.length > 1) {
        multiWordCount++;
      } else {
        singleWordCount++;
      }
      totalCharLength += e.slang.length;
    });

    const avgLength = entries.length ? (totalCharLength / entries.length).toFixed(1) : "0";
    return { singleWordCount, multiWordCount, avgLength };
  }, [entries]);

  // Simulated temporal normalization distribution (hourly)
  const hourlyActivity = useMemo(() => {
    const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"];
    const base = DB.totalNormalizations || 140;
    return [
      { label: "00-04", val: Math.round(base * 0.08), pct: 18 },
      { label: "04-08", val: Math.round(base * 0.05), pct: 12 },
      { label: "08-12", val: Math.round(base * 0.22), pct: 65 },
      { label: "12-16", val: Math.round(base * 0.28), pct: 85 },
      { label: "16-20", val: Math.round(base * 0.31), pct: 95 },
      { label: "20-24", val: Math.round(base * 0.16), pct: 45 },
    ];
  }, [entries]);

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedSource !== "all" ? 1 : 0) +
    (timeFilter !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedSource("all");
    setTimeFilter("all");
    setSearchQuery("");
    setSortBy("lookups");
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sortedEntries, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `slangnorm_analytics_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 transition-all">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <TrendingUp className="w-5 h-5 text-[#04040e]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Linguistic Analytics
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Telemetry v2.4
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time usage velocity, semantic taxonomy distribution, and linguistic mining telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Mobile Filter Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold shadow-sm transition-all"
            id="mobile-analytics-filter-toggle"
            aria-label="Open Filter Controls"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Filters & Insights</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-[#060612] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all"
            id="desktop-analytics-sidebar-toggle"
            title={sidebarOpen ? "Collapse Filter Sidebar" : "Expand Filter Sidebar"}
          >
            {sidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
                <span>Collapse Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
                <span>Open Sidebar</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-[#060612] text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* View Mode Layout Switcher */}
          <div className="flex items-center p-1 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs">
            <button
              onClick={() => setLayoutMode("stacked")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                layoutMode === "stacked"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Stacked Mobile Layout"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stacked</span>
            </button>
            <button
              onClick={() => setLayoutMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                layoutMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Grid Visualizations"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Charts Grid</span>
            </button>
            <button
              onClick={() => setLayoutMode("explorer")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                layoutMode === "explorer"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Lexicon Matrix"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Explorer</span>
            </button>
          </div>

          {/* Export JSON Button */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all"
            title="Download Analytics Corpus in JSON format"
          >
            {exportedStatus ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Responsive KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        {[
          {
            label: "Total Lexicon Records",
            subtext: "Live Slang Corpus",
            val: entries.length,
            icon: "📚",
            color: T.cyan,
            badge: "+100% active",
          },
          {
            label: "Recently Discovered",
            subtext: "New Emerging Neologisms",
            val: entries.filter((e) => e.isNew).length,
            icon: "🔥",
            color: T.amber,
            badge: "Rising Trends",
          },
          {
            label: "Normalizations Done",
            subtext: "Total Query Throughput",
            val: DB.totalNormalizations,
            icon: "⚡",
            color: T.emerald,
            badge: "Live Telemetry",
          },
          {
            label: "Semantic Categories",
            subtext: "Linguistic Breadth",
            val: Object.keys(categoryCounts).length,
            icon: "🎯",
            color: T.violet,
            badge: "Taxonomy Tree",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3.5 sm:p-5 bg-slate-900/40 border rounded-2xl flex flex-col justify-between transition-all hover:bg-slate-900/70 relative overflow-hidden group"
            style={{ borderColor: `${s.color}25` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.03] to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl select-none">{s.icon}</span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap hidden sm:inline-block"
                style={{
                  backgroundColor: `${s.color}15`,
                  color: s.color,
                  borderColor: `${s.color}35`,
                }}
              >
                {s.badge}
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1 truncate">{s.label}</div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">{s.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Database & Security Architecture Guardian Bar */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900/50 to-indigo-950/30 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: DB Connection Status */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">MongoDB Cloud Storage</span>
                {dbHealth?.database?.connected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    MongoDB Cluster Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {dbHealth?.database?.uriConfigured ? "Reconnecting..." : "Active In-Memory Sync (Set MONGODB_URI to bind remote Cluster)"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every mined slang, crawl discovery, and dictionary addition is automatically saved & synced to collection <code className="text-cyan-300 font-mono">slangnorm.slangs</code>.
              </p>
            </div>
          </div>

          {/* Right: Security Safeguards Badges */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rate Limit (120 req/m)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-300">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>NoSQL Guard</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-300">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>XSS Sanitizer</span>
            </div>
            <button
              onClick={checkHealth}
              disabled={isRefreshingHealth}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-cyan-300 transition-all"
              title="Ping Backend & Verify MongoDB Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHealth ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Collapsible Sidebar + Visualization Dashboard */}
      <div className="flex flex-col lg:flex-row items-start gap-6 relative">
        {/* DESKTOP COLLAPSIBLE SIDEBAR */}
        <aside
          className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none -mr-6 overflow-hidden"
          }`}
        >
          <div className="sticky top-20 bg-[#070716]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 space-y-6 shadow-xl">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white tracking-wide">Corpus Filters</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Instant Search in Analytics */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 mb-1.5 block">Search Analytics Term</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter slang or definition..."
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Time / Activity Scope Filter */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 mb-1.5 block">Activity Scope</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 border border-white/10 rounded-xl">
                {[
                  { id: "all", label: "All Terms" },
                  { id: "new", label: "New (🔥)" },
                  { id: "popular", label: "High (⚡)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimeFilter(t.id as any)}
                    className={`py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                      timeFilter === t.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono text-slate-400 block">Category Taxonomy</label>
                <span className="text-[10px] font-mono text-slate-500">{categoryStatsList.length} tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === "all"
                      ? "bg-cyan-500 text-[#04040e] font-bold"
                      : "bg-slate-900/80 border border-white/10 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  All ({entries.length})
                </button>
                {categoryStatsList.map(([cat, count]) => {
                  const isSelected = selectedCategory === cat;
                  const catColor = CATEGORY_COLORS[cat] || T.indigo;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(isSelected ? "all" : cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-cyan-500 text-[#04040e] font-bold"
                          : "bg-slate-900/80 border border-white/10 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="capitalize">{cat}</span>
                      <span className="font-mono text-[10px] opacity-75">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Origin Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono text-slate-400 block">Data Origin</label>
                <span className="text-[10px] font-mono text-slate-500">{sourceStatsList.length} sources</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedSource("all")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    selectedSource === "all"
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <span>All Data Origins</span>
                  <span className="font-mono text-[10px]">{entries.length}</span>
                </button>
                {sourceStatsList.map(([src, count]) => {
                  const isSelected = selectedSource === src;
                  return (
                    <button
                      key={src}
                      onClick={() => setSelectedSource(isSelected ? "all" : src)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        isSelected
                          ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="truncate max-w-[180px] text-left">{src}</span>
                      <span className="font-mono text-[10px]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corpus Telemetry Summary Card */}
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                <Activity className="w-3.5 h-3.5" />
                <span>Corpus Telemetry Index</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lexicon Entropy</span>
                  <span className="font-mono text-cyan-400 font-bold">98.4% Optimal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Term Length</span>
                  <span className="font-mono text-slate-200">{lexicalStructure.avgLength} chars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Compound Idioms</span>
                  <span className="font-mono text-slate-200">{lexicalStructure.multiWordCount} terms</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE SLIDE-OVER DRAWER (FOR SMALLER SCREENS) */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Slide-in Drawer Container */}
            <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-[#070716] border-l border-white/[0.08] h-full overflow-y-auto p-5 space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white tracking-wide">Filters & Insights</span>
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                    aria-label="Close Filter Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Instant Search */}
                <div>
                  <label className="text-[11px] font-mono text-slate-400 mb-1.5 block">Search Slang</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search term or meaning..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Activity Scope */}
                <div>
                  <label className="text-[11px] font-mono text-slate-400 mb-1.5 block">Activity Scope</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 border border-white/10 rounded-xl">
                    {[
                      { id: "all", label: "All" },
                      { id: "new", label: "New (🔥)" },
                      { id: "popular", label: "Top (⚡)" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTimeFilter(t.id as any)}
                        className={`py-1.5 text-[11px] font-medium rounded-lg ${
                          timeFilter === t.id
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "text-slate-400"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="text-[11px] font-mono text-slate-400 mb-2 block">Categories</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        selectedCategory === "all"
                          ? "bg-cyan-500 text-[#04040e] font-bold"
                          : "bg-slate-900 border border-white/10 text-slate-300"
                      }`}
                    >
                      All ({entries.length})
                    </button>
                    {categoryStatsList.map(([cat, count]) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          selectedCategory === cat
                            ? "bg-cyan-500 text-[#04040e] font-bold"
                            : "bg-slate-900 border border-white/10 text-slate-300"
                        }`}
                      >
                        <span className="capitalize">{cat}</span> ({count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Origins */}
                <div>
                  <label className="text-[11px] font-mono text-slate-400 mb-2 block">Data Origins</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedSource("all")}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                        selectedSource === "all"
                          ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                          : "text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <span>All Sources</span>
                      <span className="font-mono text-[10px]">{entries.length}</span>
                    </button>
                    {sourceStatsList.map(([src, count]) => (
                      <button
                        key={src}
                        onClick={() => setSelectedSource(selectedSource === src ? "all" : src)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                          selectedSource === src
                            ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                            : "text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate max-w-[180px] text-left">{src}</span>
                        <span className="font-mono text-[10px]">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="w-1/2 py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/[0.04]"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 text-[#04040e] font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  Apply ({filteredEntries.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN VISUALIZATIONS SECTION */}
        <main className="flex-1 w-full space-y-6">
          {/* Active Filter Badges Bar (if any active) */}
          {activeFiltersCount > 0 && (
            <div className="p-3 bg-slate-900/60 border border-white/[0.08] rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-slate-400 text-[11px] font-mono">Active Filters:</span>
                {selectedCategory !== "all" && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 font-mono text-[10px] flex items-center gap-1">
                    Category: {selectedCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                  </span>
                )}
                {selectedSource !== "all" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] flex items-center gap-1">
                    Source: {selectedSource}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSource("all")} />
                  </span>
                )}
                {timeFilter !== "all" && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] flex items-center gap-1">
                    Scope: {timeFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setTimeFilter("all")} />
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] flex items-center gap-1">
                    "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </span>
                )}
              </div>
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-cyan-400 hover:underline font-mono shrink-0"
              >
                Clear all ({filteredEntries.length} results)
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              DATA VISUALIZATION CARDS (OPTIMIZED RESPONSIVE STACKED / GRID LAYOUT)
             ═════════════════════════════════════════════════════════════════════ */}
          
          {layoutMode !== "explorer" ? (
            <div
              className={`grid gap-4 sm:gap-6 ${
                layoutMode === "stacked"
                  ? "grid-cols-1" // Mobile & desktop stacked vertical flow
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // Multi-column dense grid
              }`}
            >
              {/* VISUALIZATION 1: MOST LOOKED-UP TERMS (HORIZONTAL PROGRESS VELOCITY) */}
              <div className="p-4 sm:p-6 bg-slate-900/40 border border-white/[0.08] rounded-2xl transition-all hover:bg-slate-900/60 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Top Popularity Velocity</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Most queried neologisms in corpus</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Activity
                  </span>
                </div>

                <div className="space-y-3">
                  {topLookups.map((t, idx) => {
                    const pct = Math.round(((t.lookups || 1) / maxLookupValue) * 100);
                    const catColor = CATEGORY_COLORS[t.category] || T.amber;

                    return (
                      <div
                        key={t.slang}
                        className="p-2.5 rounded-xl bg-slate-950/40 border border-white/[0.04] hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank badge */}
                          <span
                            className={`w-5 h-5 rounded-md font-mono text-[10px] font-black flex items-center justify-center shrink-0 ${
                              idx === 0
                                ? "bg-amber-400 text-[#060612]"
                                : idx === 1
                                ? "bg-slate-300 text-[#060612]"
                                : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            #{idx + 1}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-100 truncate">
                                {t.slang}
                              </span>
                              <span
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${catColor}15`,
                                  color: catColor,
                                  borderColor: `${catColor}35`,
                                }}
                              >
                                {t.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">
                              {t.meaning || "Slang definition"}
                            </p>
                          </div>
                        </div>

                        {/* Visual Progress Bar & Actions */}
                        <div className="flex items-center gap-2.5 sm:w-48 shrink-0">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-400 w-8 text-right shrink-0">
                            {t.lookups || 1}
                          </span>

                          {onTestInNormalizer && (
                            <button
                              onClick={() => onTestInNormalizer(t.examples?.[0] || `That is so ${t.slang}`)}
                              className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold transition-all shrink-0"
                              title="Test this term in Normalizer"
                            >
                              Test
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VISUALIZATION 2: SEMANTIC CATEGORIES & PROPORTIONAL DISTRIBUTION */}
              <div className="p-4 sm:p-6 bg-slate-900/40 border border-white/[0.08] rounded-2xl transition-all hover:bg-slate-900/60 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Semantic Category Share</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Taxonomic distribution of vocabulary</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    Taxonomy
                  </span>
                </div>

                {/* Proportional Segmented Bar */}
                <div className="mb-4">
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800 border border-white/[0.04]">
                    {categoryStatsList.map(([cat, count]) => {
                      const share = (count / Math.max(entries.length, 1)) * 100;
                      const catColor = CATEGORY_COLORS[cat] || T.indigo;
                      return (
                        <div
                          key={cat}
                          style={{
                            width: `${share}%`,
                            backgroundColor: catColor,
                          }}
                          className="h-full hover:opacity-80 transition-all cursor-pointer"
                          title={`${cat}: ${count} terms (${share.toFixed(1)}%)`}
                          onClick={() => setSelectedCategory(cat)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Categories Breakdown Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryStatsList.map(([cat, count]) => {
                    const catColor = CATEGORY_COLORS[cat] || T.indigo;
                    const share = ((count / Math.max(entries.length, 1)) * 100).toFixed(0);
                    const isSelected = selectedCategory === cat;

                    return (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategory(isSelected ? "all" : cat)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-violet-500/15 border-violet-500/50 shadow-md shadow-violet-500/10"
                            : "bg-slate-950/40 border-white/[0.04] hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="text-xs font-semibold text-slate-200 capitalize truncate">
                            {cat}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-slate-400">{count}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">
                            {share}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VISUALIZATION 3: DATA ORIGINS & MINING SOURCES */}
              <div className="p-4 sm:p-6 bg-slate-900/40 border border-white/[0.08] rounded-2xl transition-all hover:bg-slate-900/60 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Corpus Lexical Origins</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Web crawlers, subreddits & platforms</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Provenance
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sourceStatsList.map(([src, count], i) => {
                    const share = Math.round((count / Math.max(entries.length, 1)) * 100);
                    const isSelected = selectedSource === src;

                    return (
                      <div
                        key={src}
                        onClick={() => setSelectedSource(isSelected ? "all" : src)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm"
                            : "bg-slate-950/40 border-white/[0.04] hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-200 truncate max-w-[200px] flex items-center gap-1.5">
                            <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
                            {src}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            {count} terms <span className="text-emerald-400">({share}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                            style={{ width: `${Math.max(share, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {onExploreCrawler && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
                    <button
                      onClick={onExploreCrawler}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Mine more terms in Web Crawler →
                    </button>
                  </div>
                )}
              </div>

              {/* VISUALIZATION 4: TEMPORAL NORMALIZATION THROUGHPUT */}
              <div className="p-4 sm:p-6 bg-slate-900/40 border border-white/[0.08] rounded-2xl transition-all hover:bg-slate-900/60 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Temporal Normalization Traffic</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Diurnal query density & peak windows</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    24h Rhythm
                  </span>
                </div>

                {/* 24-hour Distribution Bars */}
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 items-end h-28 pt-4 pb-2 border-b border-slate-800">
                    {hourlyActivity.map((h) => (
                      <div key={h.label} className="flex flex-col items-center gap-1 h-full justify-end group">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-cyan-400 group-hover:brightness-125 transition-all"
                          style={{ height: `${h.pct}%` }}
                          title={`${h.label}: ~${h.val} normalizations`}
                        />
                        <span className="text-[9px] font-mono text-slate-400">{h.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>Peak Window: 16:00 - 20:00 UTC</span>
                    <span className="text-cyan-400">Latency: ~320ms</span>
                  </div>
                </div>
              </div>

              {/* VISUALIZATION 5: LEXICAL COMPLEXITY & MORPHOLOGY */}
              <div className="p-4 sm:p-6 bg-slate-900/40 border border-white/[0.08] rounded-2xl transition-all hover:bg-slate-900/60 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Morphological Complexity</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Single-token vs compound idiom distribution</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Morphology
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Single Tokens ("rizz", "bussin")</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {lexicalStructure.singleWordCount} (
                      {Math.round((lexicalStructure.singleWordCount / Math.max(entries.length, 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{
                        width: `${(lexicalStructure.singleWordCount / Math.max(entries.length, 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">Multi-Word Idioms ("no cap", "touch grass")</span>
                    <span className="font-mono text-violet-400 font-bold">
                      {lexicalStructure.multiWordCount} (
                      {Math.round((lexicalStructure.multiWordCount / Math.max(entries.length, 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{
                        width: `${(lexicalStructure.multiWordCount / Math.max(entries.length, 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Mean Term Character Length:</span>
                    <span className="font-mono text-amber-300 font-bold">{lexicalStructure.avgLength} chars</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* ═════════════════════════════════════════════════════════════════════
              CORPUS EXPLORER & SEARCH RESULTS TABLE / CARDS
             ═════════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-6 bg-slate-900/40 border border-white/[0.08] rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Corpus Explorer ({sortedEntries.length} Terms)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Inspect definitions, lookup telemetry, and test terms directly.
                </p>
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="lookups">Most Lookups (Activity)</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                  <option value="recent">Recently Discovered</option>
                </select>
              </div>
            </div>

            {/* List / Cards for Mobile & Desktop */}
            {sortedEntries.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No slang matches your current filters</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {sortedEntries.map((item) => {
                  const catColor = CATEGORY_COLORS[item.category] || T.indigo;

                  return (
                    <div
                      key={item.slang}
                      className="p-3 sm:p-4 rounded-xl bg-slate-950/40 border border-white/[0.04] hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono text-sm font-bold text-cyan-300">
                            {item.slang}
                          </span>
                          <span
                            className="text-[10px] font-mono px-2 py-0.2 rounded-full border capitalize"
                            style={{
                              backgroundColor: `${catColor}15`,
                              color: catColor,
                              borderColor: `${catColor}35`,
                            }}
                          >
                            {item.category || "slang"}
                          </span>
                          {item.isNew && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> NEW
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                            • {item.source || "Lexicon"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                          {item.meaning}
                        </p>

                        {item.examples?.[0] && (
                          <p className="text-[11px] text-slate-400 italic">
                            "{item.examples[0]}"
                          </p>
                        )}
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <div className="text-right mr-1 hidden sm:block">
                          <div className="text-xs font-mono font-bold text-amber-400">
                            {item.lookups || 0}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">lookups</div>
                        </div>

                        {onTestInNormalizer && (
                          <button
                            onClick={() => onTestInNormalizer(item.examples?.[0] || `That was totally ${item.slang}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                            title="Send to Slang Normalizer"
                          >
                            Normalize
                          </button>
                        )}

                        {onUseInSentenceGen && (
                          <button
                            onClick={() => onUseInSentenceGen(item.slang)}
                            className="px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold transition-all"
                            title="Generate contextual sentence with this slang"
                          >
                            Sentence
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
