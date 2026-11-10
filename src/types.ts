export interface SlangEntry {
  slang: string;
  meaning: string;
  category: string;
  source: string;
  sourceUrl?: string;
  examples?: string[];
  exampleTranslation?: string;
  addedAt?: string;
  lookups?: number;
  isNew?: boolean;
}

export interface Detection {
  slang: string;
  meaning: string;
  category: string;
  source: string;
}

export interface NormalizerResult {
  normalized: string;
  detections: Detection[];
  score: number;
  originalInput: string;
  error?: string;
}

export interface GeneratedSentence {
  sentence: string;
  slangs_used: string[];
  translation: string;
}

export interface CrawlLogItem {
  msg: string;
  type: "info" | "success" | "warn" | "system";
  ts: string;
}

export interface HistoryItem {
  input: string;
  output: string;
  detections: Detection[];
  score: number;
  ts: string;
}

export interface CrawlSource {
  id: string;
  name: string;
  url: string;
  category: string;
  color: string;
  icon: string;
  enabled: boolean;
  description: string;
}
