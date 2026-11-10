// ─── Local Slang Database & State Service with MongoDB Cloud Sync ───────────────
import {
  fetchSlangsFromDB,
  saveSlangToDB,
  bulkSaveSlangsToDB,
  deleteSlangFromDB,
} from "./api";
import { COMPREHENSIVE_SLANG_CORPUS, SlangEntryData } from "../data/defaultSlangs";

export interface SlangEntry {
  slang: string;
  meaning: string;
  category: string;
  source: string;
  sourceUrl?: string;
  examples?: string[];
  exampleTranslation?: string;
  isNew?: boolean;
  addedAt?: string;
  lookups?: number;
  updatedAt?: string;
}

class SlangDatabase {
  private data: Map<string, SlangEntry> = new Map();
  private listeners: (() => void)[] = [];
  public totalNormalizations: number = 142;
  public isSyncedWithMongo: boolean = false;
  public lastSyncTime: string | null = null;

  constructor() {
    this.load();
    this.syncWithServer();
  }

  private load() {
    // 1. Seed baseline with comprehensive verified lexicon first
    COMPREHENSIVE_SLANG_CORPUS.forEach((item) => {
      this.data.set(item.slang.toLowerCase().trim(), { ...item });
    });

    // 2. Scan and aggregate all existing local storage keys (including legacy migrations)
    const STORAGE_KEYS = [
      "slangnorm_db_v2",
      "slangnorm_db",
      "slangnorm_db_v1",
      "slangnorm_slangs",
      "slangnorm_terms",
      "slangs_data",
      "crawled_slangs",
      "slangs",
    ];

    STORAGE_KEYS.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: Partial<SlangEntry>) => {
              if (item && item.slang) {
                const cleanKey = item.slang.toLowerCase().trim();
                const existing = this.data.get(cleanKey);
                this.data.set(cleanKey, {
                  slang: item.slang.trim(),
                  meaning: item.meaning || existing?.meaning || "",
                  category: item.category || existing?.category || "general",
                  source: item.source || existing?.source || "User Manual",
                  sourceUrl: item.sourceUrl || existing?.sourceUrl,
                  examples: item.examples || existing?.examples || [`Example usage of ${item.slang}`],
                  exampleTranslation: item.exampleTranslation || existing?.exampleTranslation || "",
                  isNew: item.isNew ?? existing?.isNew ?? false,
                  addedAt: item.addedAt || existing?.addedAt || new Date().toISOString(),
                  lookups: Math.max(item.lookups || 0, existing?.lookups || 0),
                  updatedAt: item.updatedAt || existing?.updatedAt,
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn(`Storage migration check for key "${key}" notice:`, e);
      }
    });

    this.persist();
  }

  private persist() {
    try {
      const allEntries = this.all();
      localStorage.setItem("slangnorm_db_v2", JSON.stringify(allEntries));
      localStorage.setItem("slangnorm_db", JSON.stringify(allEntries));
    } catch (_) {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async syncWithServer(): Promise<{ count: number; success: boolean }> {
    try {
      const serverSlangs = await fetchSlangsFromDB();
      const serverKeySet = new Set<string>();

      if (Array.isArray(serverSlangs) && serverSlangs.length > 0) {
        serverSlangs.forEach((item) => {
          if (item.slang) {
            const key = item.slang.toLowerCase().trim();
            serverKeySet.add(key);
            const local = this.data.get(key);
            this.data.set(key, {
              slang: item.slang.trim(),
              meaning: item.meaning || local?.meaning || "",
              category: item.category || local?.category || "general",
              source: item.source || local?.source || "Cloud DB",
              sourceUrl: item.sourceUrl || local?.sourceUrl,
              examples: item.examples || local?.examples || [`Usage of ${item.slang}`],
              exampleTranslation: item.exampleTranslation || local?.exampleTranslation || "",
              isNew: item.isNew ?? local?.isNew ?? false,
              addedAt: item.addedAt || local?.addedAt || new Date().toISOString(),
              lookups: Math.max(item.lookups || 0, local?.lookups || 0),
              updatedAt: item.updatedAt || local?.updatedAt,
            });
          }
        });
      }

      // Check if we have local entries that the server doesn't have yet
      const missingOnServer: SlangEntry[] = [];
      this.data.forEach((localVal, key) => {
        if (!serverKeySet.has(key)) {
          missingOnServer.push(localVal);
        }
      });

      if (missingOnServer.length > 0) {
        bulkSaveSlangsToDB(missingOnServer).catch(() => {});
      }

      this.isSyncedWithMongo = true;
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.persist();
      return { count: this.data.size, success: true };
    } catch (err) {
      console.warn("SlangDatabase server sync notice:", err);
      return { count: this.data.size, success: false };
    }
  }

  /**
   * Restores all baseline master lexicon terms while merging existing local custom entries.
   */
  public restoreAndMergeMasterLexicon(): number {
    COMPREHENSIVE_SLANG_CORPUS.forEach((item) => {
      const key = item.slang.toLowerCase().trim();
      const existing = this.data.get(key);
      if (!existing) {
        this.data.set(key, { ...item });
      } else {
        // Enrich existing entry if missing examples or definition
        this.data.set(key, {
          ...item,
          ...existing,
          meaning: existing.meaning || item.meaning,
          examples: existing.examples && existing.examples.length > 0 ? existing.examples : item.examples,
          exampleTranslation: existing.exampleTranslation || item.exampleTranslation,
          lookups: Math.max(item.lookups || 0, existing.lookups || 0),
        });
      }
    });

    this.persist();
    // Re-sync with backend
    bulkSaveSlangsToDB(this.all()).catch(() => {});
    return this.data.size;
  }

  public all(): SlangEntry[] {
    return Array.from(this.data.values());
  }

  public size(): number {
    return this.data.size;
  }

  public peek(key: string): SlangEntry | undefined {
    return this.data.get(key.toLowerCase().trim());
  }

  public get(key: string): SlangEntry | undefined {
    const entry = this.peek(key);
    if (entry) {
      entry.lookups = (entry.lookups || 0) + 1;
      this.persist();
      // Async update in MongoDB/Backend
      saveSlangToDB(entry).catch(() => {});
    }
    return entry;
  }

  public set(key: string, entry: Partial<SlangEntry>) {
    const cleanKey = key.toLowerCase().trim();
    const existing = this.data.get(cleanKey);
    const fullEntry: SlangEntry = {
      slang: key.trim(),
      meaning: entry.meaning || existing?.meaning || "",
      category: entry.category || existing?.category || "general",
      source: entry.source || existing?.source || "User Manual",
      sourceUrl: entry.sourceUrl || existing?.sourceUrl,
      examples: entry.examples || existing?.examples || [`Everyone is using ${key} now.`],
      exampleTranslation: entry.exampleTranslation || existing?.exampleTranslation || entry.meaning || "",
      isNew: entry.isNew ?? true,
      addedAt: entry.addedAt || existing?.addedAt || new Date().toISOString(),
      lookups: existing?.lookups || 0,
      updatedAt: new Date().toISOString(),
    };
    this.data.set(cleanKey, fullEntry);
    this.persist();

    // Persist asynchronously to MongoDB database
    saveSlangToDB(fullEntry).catch((err) => {
      console.warn("Failed to sync new slang with MongoDB endpoint:", err);
    });
  }

  public bulkAdd(entries: Partial<SlangEntry>[]) {
    const validEntries: SlangEntry[] = [];
    entries.forEach((e) => {
      if (e.slang && typeof e.slang === "string" && e.slang.trim().length > 0) {
        const cleanKey = e.slang.toLowerCase().trim();
        const existing = this.data.get(cleanKey);
        const fullEntry: SlangEntry = {
          slang: e.slang.trim(),
          meaning: e.meaning || existing?.meaning || "",
          category: e.category || existing?.category || "general",
          source: e.source || existing?.source || "Web Crawler",
          sourceUrl: e.sourceUrl || existing?.sourceUrl,
          examples: e.examples || existing?.examples || [`Everyone is saying ${e.slang} now.`],
          exampleTranslation: e.exampleTranslation || existing?.exampleTranslation || e.meaning || "",
          isNew: e.isNew ?? true,
          addedAt: e.addedAt || existing?.addedAt || new Date().toISOString(),
          lookups: existing?.lookups || 0,
          updatedAt: new Date().toISOString(),
        };
        this.data.set(cleanKey, fullEntry);
        validEntries.push(fullEntry);
      }
    });

    if (validEntries.length > 0) {
      this.persist();
      // Single bulk sync to server/MongoDB
      bulkSaveSlangsToDB(validEntries).catch((err) => {
        console.warn("Failed to bulk sync crawled slangs with database:", err);
      });
    }
  }

  public delete(key: string) {
    const cleanKey = key.toLowerCase().trim();
    const deleted = this.data.delete(cleanKey);
    if (deleted) {
      this.persist();
      deleteSlangFromDB(cleanKey).catch(() => {});
    }
  }

  public clearNewFlags() {
    this.data.forEach((val) => {
      val.isNew = false;
    });
    this.persist();
  }

  public incrementNormalization() {
    this.totalNormalizations += 1;
    this.notify();
  }
}

export const DB = new SlangDatabase();
