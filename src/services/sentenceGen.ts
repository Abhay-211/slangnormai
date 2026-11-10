import { DB, SlangEntry } from "./db";
import { COMPREHENSIVE_SLANG_CORPUS } from "../data/defaultSlangs";

export interface GeneratedSentenceResult {
  sentence: string;
  slangs_used: string[];
  translation: string;
}

// Map for quick lexicon lookup
const lexiconMap = new Map<string, (typeof COMPREHENSIVE_SLANG_CORPUS)[0]>();
COMPREHENSIVE_SLANG_CORPUS.forEach((item) => {
  lexiconMap.set(item.slang.toLowerCase().trim(), item);
});

/**
 * Splits input string into individual clean slang terms.
 */
export function extractSlangTerms(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  // Split by commas, semicolons, or newlines first
  let terms = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // If user just typed space-separated words without punctuation, check multi-word terms first
  if (terms.length === 1 && terms[0].includes(" ")) {
    const text = terms[0].toLowerCase();
    const knownMultiWords = [
      "no cap",
      "touch grass",
      "crash out",
      "main character energy",
      "main character",
      "ate and left no crumbs",
      "left no crumbs",
      "aura points",
      "let him cook",
      "living rent free",
      "rent free",
      "unspoken rizz",
      "sigma grindset",
      "hits different",
      "vibe check",
      "fanum tax",
      "glow up",
      "side eye",
      "understood the assignment",
      "nah yeah",
      "yeah nah",
    ];

    const detected: string[] = [];
    let remaining = text;
    for (const mw of knownMultiWords) {
      if (remaining.includes(mw)) {
        detected.push(mw);
        remaining = remaining.replace(mw, " ");
      }
    }
    const singles = remaining.split(/\s+/).filter((w) => w.length > 1);
    if (detected.length > 0 || singles.length > 1) {
      terms = [...detected, ...singles];
    }
  }

  return terms;
}

/**
 * Synthesizes dynamic, authentic, context-aware sentences tailored to the provided slang terms,
 * context scenario, and dialect style.
 */
export function generateDynamicSentences(
  slangsInput: string,
  context: string = "casual conversation",
  style: string = "Gen-Z",
  count: number = 3
): GeneratedSentenceResult[] {
  const terms = extractSlangTerms(slangsInput);
  if (terms.length === 0) return [];

  const results: GeneratedSentenceResult[] = [];
  const countToGen = Math.min(Math.max(count, 1), 5);

  // Collect metadata for each target slang
  const termDetails = terms.map((t) => {
    const key = t.toLowerCase().trim();
    const fromDB = DB.peek(key);
    const fromLexicon = lexiconMap.get(key);
    const meaning = fromDB?.meaning || fromLexicon?.meaning || `slang denoting "${t}"`;
    const category = fromDB?.category || fromLexicon?.category || "general";
    const example = fromDB?.examples?.[0] || fromLexicon?.examples?.[0];
    const exampleTrans = fromDB?.exampleTranslation || fromLexicon?.exampleTranslation;
    return {
      term: t,
      cleanTerm: key,
      meaning,
      category,
      example,
      exampleTrans,
    };
  });

  for (let i = 0; i < countToGen; i++) {
    // Pick primary term (and optional secondary term for multi-slang combinations)
    const primary = termDetails[i % termDetails.length];
    const secondary =
      termDetails.length > 1 ? termDetails[(i + 1) % termDetails.length] : null;

    const usedTerms = secondary && i % 2 === 1 && secondary.cleanTerm !== primary.cleanTerm
      ? [primary.term, secondary.term]
      : [primary.term];

    const gen = buildSentenceForTerm(primary, secondary, context, style, i);
    results.push(gen);
  }

  return results;
}

interface TermDetail {
  term: string;
  cleanTerm: string;
  meaning: string;
  category: string;
  example?: string;
  exampleTrans?: string;
}

function buildSentenceForTerm(
  primary: TermDetail,
  secondary: TermDetail | null,
  context: string,
  style: string,
  variationIndex: number
): GeneratedSentenceResult {
  const t = primary.term;
  const m = primary.meaning;
  const cat = primary.category.toLowerCase();

  // Dialect-specific prefixes & suffixes
  const stylePrefixes: Record<string, string[]> = {
    "Gen-Z": ["ngl", "lowkey", "fr", "literally", "bro", "honestly", "ong"],
    AAVE: ["real talk", "deadass", "straight up", "no lie", "listen", "facts"],
    "British slang": ["proper", "bruv", "mate", "trust me", "swear down", "innit"],
    "Internet culture": ["chat is this real", "not me thinking", "POV:", "manifesting", "certified"],
    "Mixed / Global": ["honestly", "no doubt", "for real", "truly", "wild that"],
  };

  const prefixes = stylePrefixes[style] || stylePrefixes["Gen-Z"];
  const pfx = prefixes[variationIndex % prefixes.length];

  // Contextual subjects & scenarios
  const contextScenarios: Record<string, { subject: string; action: string; transSub: string }> = {
    "casual conversation": {
      subject: "that new indie coffee spot",
      action: "was an experience",
      transSub: "the newly opened café",
    },
    "social media post": {
      subject: "the season finale dropped and it",
      action: "exceeded all hype",
      transSub: "the television series finale was released and",
    },
    "text message": {
      subject: "are you seeing what just happened? It",
      action: "is completely surreal",
      transSub: "did you observe the recent occurrence? It",
    },
    "group chat": {
      subject: "the squad's project submission",
      action: "got accepted without revisions",
      transSub: "the team's project deliverable",
    },
    "storytelling": {
      subject: "he walked into the conference room and",
      action: "commanded the whole audience",
      transSub: "he entered the executive boardroom and",
    },
    "gaming squad": {
      subject: "clutching that 1v4 ranked round",
      action: "saved our entire bracket",
      transSub: "winning the outnumbered competitive round",
    },
  };

  const ctx = contextScenarios[context] || contextScenarios["casual conversation"];

  let sentence = "";
  let translation = "";
  const slangsUsed = [t];

  // If user provided a secondary term and variation demands combining them
  if (secondary && variationIndex % 2 === 1 && secondary.cleanTerm !== primary.cleanTerm) {
    slangsUsed.push(secondary.term);
    const s2 = secondary.term;
    const m2 = secondary.meaning;

    if (style === "British slang") {
      sentence = `Trust me bruv, that play was proper ${t}, absolutely ${s2} innit!`;
      translation = `Believe me, that move was genuinely ${m}, and completely ${m2}, wouldn't you agree?`;
    } else if (context === "gaming squad") {
      sentence = `${pfx} clutching that ranked match with ${t} was straight up ${s2}.`;
      translation = `To be truthful, winning that competitive match with ${m} was completely ${m2}.`;
    } else if (context === "social media post") {
      sentence = `Dropping this fit with immaculate ${t}, the vibe is pure ${s2} #trending`;
      translation = `Sharing this curated outfit with great ${m}; the atmosphere is entirely ${m2}.`;
    } else {
      sentence = `${pfx} ${ctx.subject} has unmatched ${t} and it's highkey ${s2}.`;
      translation = `In truth, ${ctx.transSub} displays remarkable ${m} and is decidedly ${m2}.`;
    }

    return { sentence, slangs_used: slangsUsed, translation };
  }

  // Syntactic categorization builders
  if (cat.includes("evaluation") || cat.includes("trait")) {
    // Adjectival / quality terms like: bussin, mid, snatched, proper, rizz, delulu, deadass
    const adjectiveTemplates = [
      {
        s: `${pfx}, ${ctx.subject} was straight ${t}.`,
        tr: `Truthfully, ${ctx.transSub} was completely ${m}.`,
      },
      {
        s: `Everyone in the room agreed that his presentation was pure ${t}.`,
        tr: `Everyone present concurred that his presentation demonstrated ${m}.`,
      },
      {
        s: `Trying that without preparation was highkey ${t}, but somehow it worked out.`,
        tr: `Attempting that without preparation was decidedly ${m}, but it succeeded regardless.`,
      },
      {
        s: `I wasn't expecting ${ctx.subject} to be so ${t}, but it really delivered.`,
        tr: `I did not anticipate ${ctx.transSub} to be so ${m}, yet it was truly impressive.`,
      },
      {
        s: `The entire atmosphere felt so ${t} from start to finish.`,
        tr: `The overall environment felt thoroughly characterized by ${m} throughout.`,
      },
    ];
    const picked = adjectiveTemplates[variationIndex % adjectiveTemplates.length];
    sentence = picked.s;
    translation = picked.tr;
  } else if (cat.includes("action")) {
    // Verb / action terms like: touch grass, crash out, let him cook, mewing, yeet, slay, glow up
    const actionTemplates = [
      {
        s: `After arguing online for three hours straight, he seriously needed to ${t}.`,
        tr: `Following three consecutive hours of internet debate, he urgently needed to ${m}.`,
      },
      {
        s: `Hold on, ${t} before making any hasty conclusions on the project.`,
        tr: `Please wait, ${m} prior to drawing premature conclusions regarding the project.`,
      },
      {
        s: `She stepped onto the stage and decided to ${t} with absolute confidence.`,
        tr: `She stepped onto the stage and proceeded to ${m} with total self-assurance.`,
      },
      {
        s: `When the server went down before launch, the lead engineer did not ${t}.`,
        tr: `When the server experienced downtime prior to release, the principal engineer did not ${m}.`,
      },
      {
        s: `${pfx}, you have to admire how seamlessly they managed to ${t}.`,
        tr: `In all honesty, one must appreciate how effectively they were able to ${m}.`,
      },
    ];
    const picked = actionTemplates[variationIndex % actionTemplates.length];
    sentence = picked.s;
    translation = picked.tr;
  } else if (cat.includes("phrase")) {
    // Discourse markers / phrases like: no cap, bet, hits different, living rent free, periodt, highkey, lowkey
    const phraseTemplates = [
      {
        s: `We delivered the highest benchmark efficiency this quarter, ${t}.`,
        tr: `We achieved the highest performance efficiency this quarter, speaking with complete honesty.`,
      },
      {
        s: `That melody has been ${t} ever since we heard the premiere.`,
        tr: `That musical theme has been continually occupying my thoughts since its initial release.`,
      },
      {
        s: `A fresh cup of pour-over coffee in the morning just ${t}.`,
        tr: `A freshly brewed artisanal coffee in the morning is exceptionally satisfying and distinct.`,
      },
      {
        s: `You want to collaborate on the prototype tomorrow afternoon? ${t}.`,
        tr: `Would you like to collaborate on the prototype tomorrow afternoon? I agree affirmatively.`,
      },
      {
        s: `Quality engineering always outlasts rushed shortcuts, ${t}.`,
        tr: `Disciplined engineering always outlasts hasty compromises, without question.`,
      },
    ];
    const picked = phraseTemplates[variationIndex % phraseTemplates.length];
    sentence = picked.s;
    translation = picked.tr;
  } else if (cat.includes("regional")) {
    // British / Aussie terms like: proper, innit, chuffed, nah yeah, yeah nah
    if (t.toLowerCase() === "innit") {
      sentence = `The weather today is exceptionally chilly, ${t}?`;
      translation = `The outdoor temperature is bitterly cold today, is it not?`;
    } else if (t.toLowerCase() === "chuffed") {
      sentence = `The whole team was absolutely ${t} with the client's stellar feedback.`;
      translation = `The entire team was deeply pleased and gratified by the client's positive review.`;
    } else if (t.toLowerCase() === "nah yeah") {
      sentence = `${t}, I will definitely attend the team dinner this Friday evening.`;
      translation = `Yes, I will certainly attend the team dinner this Friday evening.`;
    } else if (t.toLowerCase() === "yeah nah") {
      sentence = `${t}, I don't think that deployment strategy will work in production.`;
      translation = `No, I do not believe that deployment strategy is viable in the production environment.`;
    } else {
      sentence = `That was a ${t} impressive showcase from the design team, mate.`;
      translation = `That was an authentically high-quality demonstration from the design team.`;
    }
  } else {
    // General / Internet culture terms like: skibidi, brainrot, aura points, goat, main character energy, fanum tax
    const generalTemplates = [
      {
        s: `Entering the room with undeniable ${t}, everyone immediately took notice.`,
        tr: `Entering the venue exhibiting unmistakable ${m}, everyone immediately paid attention.`,
      },
      {
        s: `Watching endless repetitive video feeds will give you instant ${t}.`,
        tr: `Consuming endless repetitive short videos will rapidly cause ${m}.`,
      },
      {
        s: `Pulling off that difficult technical milestone earned the team +5000 ${t}.`,
        tr: `Achieving that challenging engineering milestone greatly boosted the team's standing (${m}).`,
      },
      {
        s: `That whole unpredictable sequence was straight up ${t}.`,
        tr: `That entire unexpected turn of events was remarkably ${m}.`,
      },
      {
        s: `He claimed the entire credit for the design like a true ${t}.`,
        tr: `He assumed complete ownership of the creative work, demonstrating ${m}.`,
      },
    ];
    const picked = generalTemplates[variationIndex % generalTemplates.length];
    sentence = picked.s;
    translation = picked.tr;
  }

  // Dialect post-touch adjustments
  if (style === "British slang" && !sentence.includes("innit") && !sentence.includes("bruv") && !sentence.includes("proper")) {
    sentence = `${sentence.replace(/\.$/, "")}, innit.`;
  }

  return {
    sentence,
    slangs_used: slangsUsed,
    translation,
  };
}
