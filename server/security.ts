import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

// ─── 1. Rate Limiting Profiles ────────────────────────────────────────────────

// General API Rate Limiter (120 requests per 1 minute window)
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "Too many requests. Please slow down.",
    retryAfterSeconds: 60,
  },
});

// Strict AI Generation Limiter (40 requests per 1 minute window)
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "AI generation quota exceeded for this IP. Please wait a moment before sending more queries.",
  },
});

// Database Mutation Limiter (60 write requests per 1 minute window)
export const dbMutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "Database write rate limit reached. Please wait before adding more terms.",
  },
});

// ─── 2. Input Sanitization & Anti-Injection Middleware ────────────────────────

/**
 * Recursively cleans an object to strip NoSQL injection operators ($gt, $where, $regex injection)
 * and trims strings while removing potentially harmful script patterns.
 */
export function sanitizeInputData(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    // Strip control characters, basic script tags, and excessive whitespace
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/[<>]/g, (char) => (char === "<" ? "&lt;" : "&gt;"))
      .trim();
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map(sanitizeInputData);
  }

  if (typeof value === "object") {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      // Block MongoDB operator keys ($where, $gt, etc.)
      if (k.startsWith("$") || k.includes(".")) {
        continue;
      }
      cleaned[k] = sanitizeInputData(v);
    }
    return cleaned;
  }

  return value;
}

/**
 * Express middleware to sanitize all incoming request bodies and query parameters.
 */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInputData(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeInputData(req.query);
  }
  next();
}

// ─── 3. Security Headers Middleware ──────────────────────────────────────────

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Enforce modern defense-in-depth HTTP security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

// ─── 4. Slang Payload Validator ──────────────────────────────────────────────

export function validateSlangPayload(req: Request, res: Response, next: NextFunction) {
  const { slang, meaning } = req.body;

  if (!slang || typeof slang !== "string" || slang.trim().length === 0) {
    return res.status(400).json({ error: "Validation Error: 'slang' string is required and cannot be empty." });
  }

  if (slang.length > 100) {
    return res.status(400).json({ error: "Validation Error: 'slang' term exceeds maximum allowed length (100 chars)." });
  }

  if (meaning && typeof meaning === "string" && meaning.length > 1000) {
    return res.status(400).json({ error: "Validation Error: 'meaning' exceeds maximum allowed length (1000 chars)." });
  }

  next();
}
