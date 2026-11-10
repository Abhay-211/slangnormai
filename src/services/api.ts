// ─── Client API Service with MongoDB & Security Integration ─────────────────

export interface DbStatusResponse {
  connected: boolean;
  type: "mongodb" | "in-memory-fallback";
  totalCount: number;
  uriConfigured: boolean;
  error?: string | null;
}

export interface HealthResponse {
  status: string;
  service: string;
  security: {
    rateLimiting: string;
    xssSanitizer: string;
    noSqlProtection: string;
    headers: string;
  };
  database: DbStatusResponse;
  hasGeminiKey: boolean;
  timestamp: string;
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 800
): Promise<string> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        maxTokens,
      }),
    });

    const text = await res.text();
    if (!text || text.trim() === "") {
      return "[]";
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return text;
    }

    if (!res.ok) {
      console.warn("API returned non-OK status:", res.status, data?.error);
      return data?.content || "[]";
    }

    return data.content || "";
  } catch (err: any) {
    console.warn("callAI request exception handled gracefully:", err);
    return "[]";
  }
}

export async function crawlSlang(params: {
  sourceName: string;
  sourceUrl: string;
  topic?: string;
  existingSlang?: string[];
  count?: number;
}): Promise<any[]> {
  try {
    const res = await fetch("/api/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      console.warn(`Crawl server response status: ${res.status}`);
    }

    const data = await res.json();
    if (data.terms && Array.isArray(data.terms)) {
      return data.terms;
    }
    return [];
  } catch (err: any) {
    console.warn("crawlSlang exception handled gracefully:", err);
    return [];
  }
}

// ─── MongoDB & Slangs API Endpoints ──────────────────────────────────────────

export async function fetchSlangsFromDB(): Promise<any[]> {
  try {
    const res = await fetch("/api/slangs");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.slangs) ? data.slangs : [];
  } catch (err) {
    console.warn("fetchSlangsFromDB notice:", err);
    return [];
  }
}

export async function saveSlangToDB(entry: any): Promise<boolean> {
  try {
    const res = await fetch("/api/slangs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    return res.ok;
  } catch (err) {
    console.warn("saveSlangToDB notice:", err);
    return false;
  }
}

export async function bulkSaveSlangsToDB(entries: any[]): Promise<number> {
  try {
    const res = await fetch("/api/slangs/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  } catch (err) {
    console.warn("bulkSaveSlangsToDB notice:", err);
    return 0;
  }
}

export async function deleteSlangFromDB(slang: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/slangs/${encodeURIComponent(slang)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.warn("deleteSlangFromDB notice:", err);
    return false;
  }
}

export async function fetchDbHealthStatus(): Promise<HealthResponse | null> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("fetchDbHealthStatus notice:", err);
    return null;
  }
}
