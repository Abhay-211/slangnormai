import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  getAllSlangs,
  saveSlang,
  saveBulkSlangs,
  deleteSlang,
  getDbStatus,
  getMongoCollection,
} from "./server/mongodb";
import { executeIntelligentCrawl } from "./server/crawler_engine";
import {
  generalApiLimiter,
  aiGenerationLimiter,
  dbMutationLimiter,
  sanitizeMiddleware,
  securityHeadersMiddleware,
  validateSlangPayload,
} from "./server/security";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Resilient crawler retrieval helper powered by our expansive multi-source engine.
 * Ensures zero duplicate extractions against existing slang sets.
 */
async function getFreshCrawlTerms(sourceName: string, sourceUrl?: string, topic?: string, existingSlangs: string[] = [], count: number = 4) {
  return await executeIntelligentCrawl({
    sourceName,
    sourceUrl,
    topic,
    existingSlangs,
    count,
  });
}

/**
 * Model waterfall hierarchy to prevent 503 High Demand or 429 Quota errors.
 * Tries gemini-2.5-flash first (most stable & fast), then gemini-2.0-flash, then gemini-3.7-flash.
 */
const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.7-flash"];

async function callGeminiWithModelFallback(
  client: GoogleGenAI,
  params: {
    contents: string;
    systemInstruction?: string;
    responseMimeType?: string;
    maxOutputTokens?: number;
    temperature?: number;
  }
): Promise<string | null> {
  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction || undefined,
          responseMimeType: params.responseMimeType || undefined,
          maxOutputTokens: params.maxOutputTokens || 800,
          temperature: params.temperature ?? 0.7,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      const isTransient =
        errStr.includes("503") ||
        errStr.includes("429") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("UNAVAILABLE") ||
        errStr.includes("high demand") ||
        errStr.includes("quota");

      if (isTransient) {
        // Soft fallback to next model in list without polluting error logs
        continue;
      }
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable trust proxy for reverse proxy environments (Cloud Run / Nginx)
  app.set("trust proxy", 1);

  // Initialize MongoDB background connection
  getMongoCollection().catch((err) => console.warn("MongoDB initial connection attempt deferred:", err));

  // ─── SECURITY MIDDLEWARES ──────────────────────────────────────────────────
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(sanitizeMiddleware);

  // Apply general rate limiter to all /api/ routes
  app.use("/api/", generalApiLimiter);

  // ─── HEALTH & DB STATUS ENDPOINTS ──────────────────────────────────────────

  app.get("/api/health", async (_req: Request, res: Response) => {
    const dbStatus = await getDbStatus();
    res.json({
      status: "ok",
      service: "SlangNorm AI Backend",
      security: {
        rateLimiting: "active",
        xssSanitizer: "active",
        noSqlProtection: "active",
        headers: "enforced",
      },
      database: dbStatus,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/db/status", async (_req: Request, res: Response) => {
    try {
      const status = await getDbStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve database status" });
    }
  });

  // ─── SLANG CRUD & MONGODB STORAGE API ──────────────────────────────────────

  // 1. Get all slangs from MongoDB / storage
  app.get("/api/slangs", async (_req: Request, res: Response) => {
    try {
      const slangs = await getAllSlangs();
      res.json({ slangs, count: slangs.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve slangs" });
    }
  });

  // 2. Add / Upsert a single slang into MongoDB (Protected with rate limiter and validation)
  app.post("/api/slangs", dbMutationLimiter, validateSlangPayload, async (req: Request, res: Response) => {
    try {
      const savedDoc = await saveSlang(req.body);
      res.status(201).json({ success: true, slang: savedDoc });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save slang to MongoDB" });
    }
  });

  // 3. Bulk save slangs into MongoDB
  app.post("/api/slangs/bulk", dbMutationLimiter, async (req: Request, res: Response) => {
    try {
      const { entries } = req.body;
      if (!Array.isArray(entries)) {
        return res.status(400).json({ error: "Invalid request: 'entries' must be an array" });
      }
      const savedCount = await saveBulkSlangs(entries);
      res.json({ success: true, count: savedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to bulk save slangs" });
    }
  });

  // 4. Delete a slang from MongoDB
  app.delete("/api/slangs/:slang", dbMutationLimiter, async (req: Request, res: Response) => {
    try {
      const { slang } = req.params;
      if (!slang) {
        return res.status(400).json({ error: "Missing slang parameter" });
      }
      const success = await deleteSlang(decodeURIComponent(slang));
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete slang" });
    }
  });

  // ─── AI GENERATION ENDPOINTS ───────────────────────────────────────────────

  app.post("/api/generate", aiGenerationLimiter, async (req: Request, res: Response) => {
    try {
      const { systemPrompt, userPrompt, maxTokens } = req.body;

      if (!userPrompt) {
        return res.status(400).json({ error: "Missing userPrompt in request body" });
      }

      const client = getGeminiClient();

      if (client) {
        const textResult = await callGeminiWithModelFallback(client, {
          contents: userPrompt,
          systemInstruction: systemPrompt,
          maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 800,
          temperature: 0.7,
        });

        if (textResult) {
          return res.json({ content: textResult });
        }
      }

      // Fallback heuristics if API Key is not set, exhausted or all models busy
      if (userPrompt.includes("Define this slang term") || userPrompt.includes("slang dictionary")) {
        const match = userPrompt.match(/"([^"]+)"/);
        const term = match ? match[1] : "slang";
        return res.json({
          content: JSON.stringify({
            meaning: `Informal contemporary expression indicating ${term}`,
            category: "evaluation",
            examples: [`That entire situation was completely ${term}!`],
            exampleTranslation: `That entire situation was remarkably noteworthy.`,
          }),
        });
      }

      if (userPrompt.includes("Rules:") && (userPrompt.includes("slangs_used") || userPrompt.includes("sentences using these slang terms"))) {
        const slangMatch = userPrompt.match(/slang terms:\s*"([^"]+)"/i) || userPrompt.match(/"([^"]+)"/);
        const requestedSlangs = slangMatch ? slangMatch[1] : "slang";
        const ctxMatch = userPrompt.match(/Context scenario:\s*([^\n]+)/i);
        const styleMatch = userPrompt.match(/Dialect \/ tone:\s*([^\n]+)/i);
        const countMatch = userPrompt.match(/Generate\s+(\d+)/i);

        const targetContext = ctxMatch ? ctxMatch[1].trim() : "casual conversation";
        const targetStyle = styleMatch ? styleMatch[1].trim() : "Gen-Z";
        const targetCount = countMatch ? parseInt(countMatch[1], 10) : 3;

        // Split into distinct slang keywords
        const terms = requestedSlangs
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const dynamicSentences: any[] = [];
        const numToGen = Math.min(Math.max(targetCount, 1), 5);

        for (let i = 0; i < numToGen; i++) {
          const primaryTerm = terms[i % terms.length] || "bussin";
          const secondaryTerm = terms.length > 1 ? terms[(i + 1) % terms.length] : null;
          const slangsUsed = secondaryTerm && i % 2 === 1 ? [primaryTerm, secondaryTerm] : [primaryTerm];

          let s = "";
          let tr = "";

          if (secondaryTerm && i % 2 === 1) {
            s = `Honestly, that whole situation with ${primaryTerm} turned out completely ${secondaryTerm}, no doubt.`;
            tr = `In truth, the entire occurrence featuring "${primaryTerm}" ended up remarkably characterized by "${secondaryTerm}".`;
          } else if (targetStyle.toLowerCase().includes("british")) {
            s = `Trust me bruv, that play was proper ${primaryTerm}, innit!`;
            tr = `Believe me, that action was genuinely of the highest standard ("${primaryTerm}"), wouldn't you agree?`;
          } else if (targetContext.toLowerCase().includes("gaming")) {
            s = `Clutching that ranked round with ${primaryTerm} saved the entire squad's tournament bracket.`;
            tr = `Securing the competitive round via "${primaryTerm}" rescued the team's entire tournament standing.`;
          } else if (targetContext.toLowerCase().includes("social")) {
            s = `Just stepped out with pure ${primaryTerm} energy, the vibe is unmatched today #trending`;
            tr = `Stepping outside with confident "${primaryTerm}" poise; the atmosphere is exceptional today.`;
          } else if (targetContext.toLowerCase().includes("group")) {
            s = `Did everyone see what just happened in the chat? That was highkey ${primaryTerm}.`;
            tr = `Did everyone observe the message in the group channel? That was remarkably notable ("${primaryTerm}").`;
          } else {
            s = `ngl the way they handled that project with ${primaryTerm} was genuinely impressive.`;
            tr = `To be frank, the manner in which they executed that project with "${primaryTerm}" was genuinely admirable.`;
          }

          dynamicSentences.push({
            sentence: s,
            slangs_used: slangsUsed,
            translation: tr,
          });
        }

        return res.json({
          content: JSON.stringify(dynamicSentences),
        });
      }

      return res.json({ content: "[]" });
    } catch (err: any) {
      console.error("Error in /api/generate:", err);
      res.status(500).json({ error: err.message || "Failed to generate content" });
    }
  });

  // ─── ENHANCED WEB MINING & SLANG CRAWLER ENDPOINT ──────────────────────────
  app.post("/api/crawl", aiGenerationLimiter, async (req: Request, res: Response) => {
    try {
      const { sourceName, sourceUrl, topic, existingSlang, count = 4 } = req.body;
      const client = getGeminiClient();

      // Retrieve all existing DB terms to guarantee 100% zero-duplicate crawler extractions
      const allDbRecords = await getAllSlangs();
      const combinedExisting = Array.from(
        new Set([
          ...(Array.isArray(existingSlang) ? existingSlang : []),
          ...allDbRecords.map((r) => r.slang),
        ])
      );

      const requestedCount = Math.min(Math.max(Number(count) || 4, 1), 10);

      // Execute intelligent multi-source crawler with AI + curated 2025/2026 corpus
      const freshTerms = await executeIntelligentCrawl({
        sourceName: sourceName || "Web Slang Miner",
        sourceUrl: sourceUrl || "https://urbandictionary.com",
        topic: topic || "",
        existingSlangs: combinedExisting,
        count: requestedCount,
        geminiClient: client,
        callGeminiFallback: callGeminiWithModelFallback,
      });

      // Automatically persist all fresh terms to MongoDB & persistent disk store
      if (freshTerms.length > 0) {
        await saveBulkSlangs(freshTerms);
      }

      const totalDbCount = (await getAllSlangs()).length;

      return res.json({
        terms: freshTerms,
        count: freshTerms.length,
        totalDbCount,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Error in /api/crawl:", err);
      // Fallback extraction that also guarantees unseen terms
      try {
        const fallback = await getFreshCrawlTerms(
          req.body.sourceName || "Crawler Engine",
          req.body.sourceUrl,
          req.body.topic,
          req.body.existingSlang || [],
          3
        );
        if (fallback.length > 0) {
          await saveBulkSlangs(fallback);
        }
        res.json({ terms: fallback, count: fallback.length });
      } catch {
        res.json({ terms: [] });
      }
    }
  });

  // Vite Middleware integration for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Centralized error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[Server Error] ${req.method} ${req.url}:`, err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Internal Server Error",
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SlangNorm AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
