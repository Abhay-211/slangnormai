import fs from "fs";
import path from "path";
import { MongoClient, Db, Collection } from "mongodb";
import { COMPREHENSIVE_SLANG_CORPUS, SlangEntryData } from "../src/data/defaultSlangs";

export interface MongoSlangDoc {
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

let mongoClient: MongoClient | null = null;
let dbInstance: Db | null = null;
let slangsCollection: Collection<MongoSlangDoc> | null = null;
let isConnecting = false;
let connectionError: string | null = null;

// Persistent local JSON file path to ensure zero data loss across dev-server restarts
const DATA_DIR = path.join(process.cwd(), "server", "data");
const FILE_STORAGE_PATH = path.join(DATA_DIR, "slang_store.json");

// In-memory cache synced with disk and MongoDB
const memoryStore = new Map<string, MongoSlangDoc>();

function persistToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(FILE_STORAGE_PATH, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.warn("Storage write notice:", err);
  }
}

function initStorage() {
  // 1. Seed baseline master slang lexicon
  COMPREHENSIVE_SLANG_CORPUS.forEach((item) => {
    memoryStore.set(item.slang.toLowerCase().trim(), { ...item });
  });

  // 2. Load any previously saved records from disk
  try {
    if (fs.existsSync(FILE_STORAGE_PATH)) {
      const raw = fs.readFileSync(FILE_STORAGE_PATH, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((item: MongoSlangDoc) => {
          if (item && item.slang) {
            memoryStore.set(item.slang.toLowerCase().trim(), { ...item });
          }
        });
        console.log(`✅ Loaded ${memoryStore.size} persistent slang records from disk`);
      }
    } else {
      persistToFile();
    }
  } catch (err) {
    console.warn("Storage initial read notice:", err);
  }
}

// Initialize on server module load
initStorage();

/**
 * Initializes and returns the MongoDB Slangs collection with resilience.
 */
export async function getMongoCollection(): Promise<Collection<MongoSlangDoc> | null> {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;

  if (!uri || !uri.startsWith("mongodb")) {
    return null;
  }

  if (slangsCollection) {
    return slangsCollection;
  }

  if (isConnecting) {
    return null;
  }

  isConnecting = true;
  try {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    });

    await mongoClient.connect();
    dbInstance = mongoClient.db("slangnorm");
    slangsCollection = dbInstance.collection<MongoSlangDoc>("slangs");

    // Create unique index on slang term and descending on addedAt
    await slangsCollection.createIndex({ slang: 1 }, { unique: true });
    await slangsCollection.createIndex({ addedAt: -1 });

    console.log("✅ Successfully connected to MongoDB cluster (Database: slangnorm, Collection: slangs)");
    connectionError = null;

    // Seed initial bootstrap terms if collection is empty
    const count = await slangsCollection.countDocuments();
    if (count === 0) {
      console.log("Seeding MongoDB with comprehensive slang lexicon...");
      await slangsCollection.insertMany(COMPREHENSIVE_SLANG_CORPUS as any);
    }

    return slangsCollection;
  } catch (err: any) {
    connectionError = err.message || "Failed to connect to MongoDB";
    console.warn("⚠️ MongoDB connection notice:", connectionError, "- Operating in resilient fallback mode.");
    slangsCollection = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Returns telemetry regarding the MongoDB connection status.
 */
export async function getDbStatus(): Promise<{
  connected: boolean;
  type: "mongodb" | "in-memory-fallback";
  totalCount: number;
  uriConfigured: boolean;
  error?: string | null;
}> {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  const col = await getMongoCollection();

  if (col) {
    try {
      const totalCount = await col.countDocuments();
      return {
        connected: true,
        type: "mongodb",
        totalCount,
        uriConfigured: true,
        error: null,
      };
    } catch (err: any) {
      return {
        connected: false,
        type: "in-memory-fallback",
        totalCount: memoryStore.size,
        uriConfigured: true,
        error: err.message,
      };
    }
  }

  return {
    connected: false,
    type: "in-memory-fallback",
    totalCount: memoryStore.size,
    uriConfigured: !!(uri && uri.startsWith("mongodb")),
    error: connectionError,
  };
}

/**
 * Retrieves all stored slangs from MongoDB (or fallback store).
 */
export async function getAllSlangs(): Promise<MongoSlangDoc[]> {
  const col = await getMongoCollection();
  if (col) {
    try {
      return await col.find({}).sort({ addedAt: -1 }).toArray();
    } catch (err) {
      console.warn("Error querying MongoDB, using local store:", err);
    }
  }
  return Array.from(memoryStore.values());
}

/**
 * Securely inserts or updates a single slang in MongoDB.
 */
export async function saveSlang(entry: Partial<MongoSlangDoc> & { slang: string }): Promise<MongoSlangDoc> {
  const cleanKey = entry.slang.toLowerCase().trim();
  const existing = memoryStore.get(cleanKey);

  const doc: MongoSlangDoc = {
    slang: entry.slang.trim(),
    meaning: entry.meaning || existing?.meaning || "",
    category: entry.category || existing?.category || "general",
    source: entry.source || existing?.source || "Manual Entry",
    sourceUrl: entry.sourceUrl || existing?.sourceUrl,
    examples: entry.examples || existing?.examples || [`Example usage of ${entry.slang}`],
    exampleTranslation: entry.exampleTranslation || existing?.exampleTranslation || "",
    isNew: entry.isNew ?? true,
    addedAt: entry.addedAt || existing?.addedAt || new Date().toISOString(),
    lookups: (entry.lookups ?? existing?.lookups) || 0,
    updatedAt: new Date().toISOString(),
  };

  // Always update memory store and persist to local JSON file
  memoryStore.set(cleanKey, doc);
  persistToFile();

  const col = await getMongoCollection();
  if (col) {
    try {
      await col.updateOne(
        { slang: { $regex: new RegExp(`^${cleanKey}$`, "i") } },
        { $set: doc },
        { upsert: true }
      );
    } catch (err) {
      console.error("Failed to write slang to MongoDB:", err);
    }
  }

  return doc;
}

/**
 * Bulk writes discovered slangs from crawlers/miners into MongoDB.
 */
export async function saveBulkSlangs(entries: Partial<MongoSlangDoc>[]): Promise<number> {
  let savedCount = 0;
  for (const item of entries) {
    if (item.slang && typeof item.slang === "string" && item.slang.trim().length > 0) {
      await saveSlang(item as any);
      savedCount++;
    }
  }
  persistToFile();
  return savedCount;
}

/**
 * Securely deletes a slang term from MongoDB.
 */
export async function deleteSlang(slangKey: string): Promise<boolean> {
  const cleanKey = slangKey.toLowerCase().trim();
  memoryStore.delete(cleanKey);
  persistToFile();

  const col = await getMongoCollection();
  if (col) {
    try {
      const res = await col.deleteOne({ slang: { $regex: new RegExp(`^${cleanKey}$`, "i") } });
      return res.deletedCount > 0;
    } catch (err) {
      console.error("Failed to delete slang from MongoDB:", err);
    }
  }

  return true;
}
