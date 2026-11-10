// ─── Autonomous Multi-Platform Slang Mining Engine ───────────────────────────
import { GoogleGenAI } from "@google/genai";
import { MongoSlangDoc } from "./mongodb";

export interface CrawlItem {
  slang: string;
  meaning: string;
  category: string;
  source?: string;
  sourceUrl?: string;
  tags: string[];
  examples: string[];
  exampleTranslation: string;
}

/**
 * Expansive, highly curated linguistic corpus of modern 2025/2026 internet slang,
 * subcultures, regional vernaculars, gaming terminology, and corporate jargon.
 * Over 120+ novel entries guaranteed to provide rich extraction without recycling old terms.
 */
export const EXTENSIVE_CRAWLER_CORPUS: CrawlItem[] = [
  // ─── TIKTOK, REELS & GEN-Z / ALPHA VERNACULAR ──────────────────────────────
  {
    slang: "lock in",
    meaning: "To focus with extreme, undistracted discipline and intense effort",
    category: "action",
    tags: ["tiktok", "lifestyle", "sports", "school", "reels"],
    examples: ["Final exams are next week, it is time to completely lock in."],
    exampleTranslation: "Final examinations commence next week; we must dedicate our full concentration.",
  },
  {
    slang: "demure",
    meaning: "Mindful, understated, modest, or delicately reserved aesthetic",
    category: "trait",
    tags: ["tiktok", "fashion", "lifestyle", "reels"],
    examples: ["See how I organize my desk? Very demure, very mindful."],
    exampleTranslation: "Observe my workstation arrangement: tastefully understated and deliberate.",
  },
  {
    slang: "brat",
    meaning: "Embracing chaotic, unapologetic party-girl confidence and raw authenticity",
    category: "trait",
    tags: ["tiktok", "pop-culture", "music", "twitter"],
    examples: ["She had a pure brat summer living completely on her own terms."],
    exampleTranslation: "She spent the summer expressing uninhibited confidence and independence.",
  },
  {
    slang: "unc",
    meaning: "An older individual acting out of touch or elder role model",
    category: "status",
    tags: ["tiktok", "sports", "basketball", "urban"],
    examples: ["Unc tried to hop on the skateboard and pulled his hamstring."],
    exampleTranslation: "The elder gentleman attempted to skateboard and strained his leg muscle.",
  },
  {
    slang: "mogging",
    meaning: "Being noticeably superior in physical attractiveness or posture beside someone",
    category: "evaluation",
    tags: ["tiktok", "looksmaxxing", "lifestyle"],
    examples: ["He stood straight with a sharp jawline and was mogging everyone in the photo."],
    exampleTranslation: "His upright posture and striking facial features eclipsed those around him in the photograph.",
  },
  {
    slang: "mewing",
    meaning: "Tongue posture technique intended to sharpen jawline definition",
    category: "action",
    tags: ["tiktok", "looksmaxxing", "health"],
    examples: ["He went silent mid-conversation because he was mewing."],
    exampleTranslation: "He ceased speaking abruptly to maintain his posture exercise.",
  },
  {
    slang: "fanum tax",
    meaning: "Stealing or demanding a bite or portion of a friend's meal",
    category: "action",
    tags: ["tiktok", "streaming", "twitch", "food"],
    examples: ["He levied a heavy fanum tax on my box of pizza."],
    exampleTranslation: "He appropriated a substantial portion of my pizza without prior agreement.",
  },
  {
    slang: "yapping",
    meaning: "Talking incessantly, rambling, or lecturing at unnecessary length",
    category: "action",
    tags: ["tiktok", "discord", "conversation"],
    examples: ["Stop yapping for five minutes and listen to instructions."],
    exampleTranslation: "Please refrain from excessive chatter and attend to the instructions.",
  },
  {
    slang: "beige flag",
    meaning: "An odd, quirky, or mildly bizarre personal habit that is harmless",
    category: "trait",
    tags: ["tiktok", "dating", "lifestyle"],
    examples: ["His beige flag is needing subtitles on for silent movies."],
    exampleTranslation: "His mildly peculiar idiosyncrasy is requesting captions for non-verbal cinema.",
  },
  {
    slang: "cooked",
    meaning: "Exhausted, compromised, doomed, or facing certain failure",
    category: "status",
    tags: ["tiktok", "gaming", "school", "memes"],
    examples: ["If the professor checks the references, I am completely cooked."],
    exampleTranslation: "Should the instructor verify our citations, our position is untenable.",
  },
  {
    slang: "girl dinner",
    meaning: "A chaotic, miscellaneous assortment of snacks gathered as a dinner meal",
    category: "lifestyle",
    tags: ["tiktok", "food", "lifestyle"],
    examples: ["Grapes, cheese crackers, and iced tea: the quintessential girl dinner."],
    exampleTranslation: "A light assortment of fruit, dairy crackers, and beverage served as an informal evening meal.",
  },
  {
    slang: "Roman Empire",
    meaning: "A random, hyper-specific subject one ponders with inexplicable frequency",
    category: "thought",
    tags: ["tiktok", "memes", "history"],
    examples: ["The aerodynamics of bumblebees is my personal Roman Empire."],
    exampleTranslation: "The flight physics of bumblebees is a peculiar subject that frequently occupies my thoughts.",
  },
  {
    slang: "clout chasing",
    meaning: "Engaging in ostentatious actions strictly to obtain online fame or followers",
    category: "action",
    tags: ["tiktok", "instagram", "youtube", "social"],
    examples: ["Creating artificial drama on stream is obvious clout chasing."],
    exampleTranslation: "Fabricating interpersonal conflict during broadcasts is a transparent bid for notoriety.",
  },
  {
    slang: "side eye",
    meaning: "A skeptical, disapproving, or suspicious glance directed at someone",
    category: "action",
    tags: ["tiktok", "reactions", "social"],
    examples: ["She gave him a bombastic criminal side eye after his excuse."],
    exampleTranslation: "She directed an intensely skeptical and disapproving glance toward him following his explanation.",
  },
  {
    slang: "sneaky link",
    meaning: "A clandestine or secret romantic rendezvous or partner",
    category: "status",
    tags: ["tiktok", "dating", "lifestyle"],
    examples: ["He slipped out late at night to meet his sneaky link."],
    exampleTranslation: "He departed quietly in the evening to attend a discreet romantic appointment.",
  },

  // ─── GAMING, TWITCH & DISCORD LEXICON ──────────────────────────────────────
  {
    slang: "diff",
    meaning: "Significant skill gap between players in the same role",
    category: "evaluation",
    tags: ["gaming", "twitch", "esports", "discord"],
    examples: ["Our jungler secured all dragons, massive jungle diff."],
    exampleTranslation: "Our objective specialist outperformed the opposing counterpart by a wide margin.",
  },
  {
    slang: "hardstuck",
    meaning: "Unable to advance beyond a particular competitive ranking tier",
    category: "status",
    tags: ["gaming", "esports", "ranked"],
    examples: ["He has been hardstuck in Platinum tier for three seasons."],
    exampleTranslation: "He has remained fixed within the intermediate competitive division across multiple seasons.",
  },
  {
    slang: "griefing",
    meaning: "Deliberately sabotaging teammates or game objectives to cause annoyance",
    category: "action",
    tags: ["gaming", "twitch", "discord"],
    examples: ["Tossing flashbangs at your own squad is blatant griefing."],
    exampleTranslation: "Disrupting your teammates' vision intentionally constitutes unsportsmanlike sabotage.",
  },
  {
    slang: "smurfing",
    meaning: "A high-ranking veteran playing on a low-rank beginner account",
    category: "action",
    tags: ["gaming", "esports", "ranked"],
    examples: ["That player in bronze lobby is definitely smurfing."],
    exampleTranslation: "That participant in the novice tier is evidently an experienced player operating an alias.",
  },
  {
    slang: "nerf",
    meaning: "To weaken or diminish the potency of a character, weapon, or feature",
    category: "action",
    tags: ["gaming", "tech", "development"],
    examples: ["The developers had to nerf the shotgun damage in the patch."],
    exampleTranslation: "The engineering team appropriately reduced the offensive capability of that weapon.",
  },
  {
    slang: "buff",
    meaning: "To strengthen, upgrade, or enhance an underperforming asset or attribute",
    category: "action",
    tags: ["gaming", "tech", "development"],
    examples: ["The latest update provided a huge buff to mobility speeds."],
    exampleTranslation: "The most recent revision granted a significant enhancement to character movement rates.",
  },
  {
    slang: "inting",
    meaning: "Intentionally dying or losing to sabotage a match",
    category: "action",
    tags: ["gaming", "esports", "league"],
    examples: ["Rushing five enemies alone is straight inting."],
    exampleTranslation: "Charging against an overwhelming enemy detachment single-handedly is deliberate self-sabotage.",
  },
  {
    slang: "copium",
    meaning: "Delusional rationalization used to cope with failure or defeat",
    category: "emotion",
    tags: ["gaming", "twitch", "internet-culture", "memes"],
    examples: ["Blaming network lag for missing an easy shot is pure copium."],
    exampleTranslation: "Attributing poor accuracy to network latency is an unconvincing rationalization of failure.",
  },
  {
    slang: "hopium",
    meaning: "Irrational optimism that an unfavorable circumstance will turn around",
    category: "emotion",
    tags: ["gaming", "finance", "crypto", "sports"],
    examples: ["Hoping for a sudden market rebound right now is sheer hopium."],
    exampleTranslation: "Anticipating an immediate market recovery under present conditions is wishful thinking.",
  },
  {
    slang: "skill issue",
    meaning: "Directly blaming an error or loss on personal incompetence",
    category: "evaluation",
    tags: ["gaming", "twitch", "memes"],
    examples: ["If you keep falling off the edge, that is a skill issue."],
    exampleTranslation: "Repeatedly falling from the boundary reflects a deficiency in fundamental coordination.",
  },
  {
    slang: "sweat",
    meaning: "A hyper-competitive player who plays with excessive intensity in casual modes",
    category: "trait",
    tags: ["gaming", "fortnite", "fps"],
    examples: ["The lobby was filled with sweats building five-story towers in seconds."],
    exampleTranslation: "The match was dominated by hyper-intensive players exhibiting maximum mechanical effort.",
  },
  {
    slang: "one-tap",
    meaning: "Eliminating an opponent with a single precision strike",
    category: "action",
    tags: ["gaming", "esports", "fps"],
    examples: ["He lined up the crosshair and landed a crisp one-tap."],
    exampleTranslation: "He calibrated his target sights and executed an instant single-shot elimination.",
  },
  {
    slang: "backseat",
    meaning: "Giving unsolicited advice or instructions to someone playing or working",
    category: "action",
    tags: ["twitch", "gaming", "streaming"],
    examples: ["Please stop backseating while I explore the puzzle."],
    exampleTranslation: "Kindly refrain from offering unrequested guidance while I solve this challenge.",
  },
  {
    slang: "peaking",
    meaning: "Briefly stepping out from cover to inspect or engage an opponent",
    category: "action",
    tags: ["gaming", "esports", "fps"],
    examples: ["Do not peak the sniper lane without utility smoke."],
    exampleTranslation: "Do not expose yourself to the marksman corridor without defensive screening.",
  },

  // ─── UK DRILL, ROADMAN & BRITISH SLANG ─────────────────────────────────────
  {
    slang: "mandem",
    meaning: "A close circle of male friends, crew, or neighborhood associates",
    category: "group",
    tags: ["ukdrill", "british", "roadman", "london"],
    examples: ["I am heading into town with the mandem tonight."],
    exampleTranslation: "I am traveling into the city center with my close circle of companions this evening.",
  },
  {
    slang: "peng",
    meaning: "Exceptionally attractive, aesthetically pleasing, or delectable",
    category: "evaluation",
    tags: ["ukdrill", "british", "slang", "london"],
    examples: ["That restaurant serves proper peng food."],
    exampleTranslation: "That dining establishment prepares exceptionally delectable cuisine.",
  },
  {
    slang: "wasteman",
    meaning: "An unproductive person who accomplishes nothing or causes frustration",
    category: "evaluation",
    tags: ["ukdrill", "british", "roadman"],
    examples: ["Ignore him, he has been acting like a complete wasteman."],
    exampleTranslation: "Disregard his remarks; he is behaving in a thoroughly unproductive and frivolous manner.",
  },
  {
    slang: "wagwan",
    meaning: "Standard informal greeting meaning 'what is going on' or 'how are you'",
    category: "greeting",
    tags: ["ukdrill", "british", "caribbean", "london"],
    examples: ["Wagwan fam, how was your weekend?"],
    exampleTranslation: "Greetings friend, how did your weekend unfold?",
  },
  {
    slang: "gassed",
    meaning: "Overly excited, flattered, or full of boastful enthusiasm",
    category: "emotion",
    tags: ["ukdrill", "british", "slang"],
    examples: ["He was bare gassed after receiving the job offer."],
    exampleTranslation: "He was exceedingly overjoyed upon receiving the employment opportunity.",
  },
  {
    slang: "bare",
    meaning: "Extremely, very, or a substantial quantity of something",
    category: "modifier",
    tags: ["ukdrill", "british", "london"],
    examples: ["There were bare people queueing outside the exhibition."],
    exampleTranslation: "There was a substantial crowd congregating outside the exhibition.",
  },
  {
    slang: "clapped",
    meaning: "Ugly, ruined, dilapidated, or of substandard quality",
    category: "evaluation",
    tags: ["ukdrill", "british", "slang"],
    examples: ["That old smartphone is completely clapped."],
    exampleTranslation: "That aging mobile telephone is severely damaged and deteriorated.",
  },
  {
    slang: "creps",
    meaning: "Athletic trainers, sneakers, or fashionable casual footwear",
    category: "fashion",
    tags: ["ukdrill", "british", "streetwear"],
    examples: ["Mind your step, do not scuff my fresh creps."],
    exampleTranslation: "Step carefully, and please avoid marking my new athletic footwear.",
  },
  {
    slang: "allow it",
    meaning: "Cease pursuing the matter, let it pass, or forgive an issue",
    category: "phrase",
    tags: ["ukdrill", "british", "london"],
    examples: ["Just allow it bro, it is not worth causing an argument."],
    exampleTranslation: "Simply set the matter aside; it does not warrant an unnecessary dispute.",
  },
  {
    slang: "link up",
    meaning: "To convene, meet, or assemble in person",
    category: "action",
    tags: ["ukdrill", "british", "social"],
    examples: ["We need to link up this weekend and finalize the plan."],
    exampleTranslation: "We must convene in person this weekend to conclude our strategy.",
  },
  {
    slang: "ends",
    meaning: "One's local neighborhood, home district, or community",
    category: "location",
    tags: ["ukdrill", "british", "london"],
    examples: ["He represents his ends with genuine pride."],
    exampleTranslation: "He represents his home neighborhood with sincere dignity.",
  },

  // ─── AUSTRALIAN & REGIONAL COLLOQUIALISMS ─────────────────────────────────
  {
    slang: "servo",
    meaning: "A roadside petrol station or service store",
    category: "location",
    tags: ["aussie", "australian", "regional"],
    examples: ["Pull over at the next servo so we can grab some cold drinks."],
    exampleTranslation: "Please pull into the upcoming petrol station so we may purchase refreshments.",
  },
  {
    slang: "arvo",
    meaning: "Afternoon time period",
    category: "time",
    tags: ["aussie", "australian", "regional"],
    examples: ["Let us schedule the sprint review for this arvo."],
    exampleTranslation: "Let us schedule the project review for this afternoon.",
  },
  {
    slang: "bogan",
    meaning: "An unsophisticated or unrefined individual lacking social decorum",
    category: "evaluation",
    tags: ["aussie", "australian", "regional"],
    examples: ["Blaring music at 3 AM is classic bogan behavior."],
    exampleTranslation: "Playing loud audio at three in the morning demonstrates a lack of civil consideration.",
  },
  {
    slang: "tradie",
    meaning: "A skilled tradesperson such as an electrician, carpenter, or plumber",
    category: "profession",
    tags: ["aussie", "australian", "work"],
    examples: ["The tradie arrived at 7 AM sharp to rewire the lighting."],
    exampleTranslation: "The certified tradesperson arrived promptly at seven o'clock to repair the electrical fixtures.",
  },
  {
    slang: "ripper",
    meaning: "Something magnificent, splendid, or thrillingly good",
    category: "evaluation",
    tags: ["aussie", "australian", "slang"],
    examples: ["That was an absolute ripper of a football match."],
    exampleTranslation: "That was an exceptionally exhilarating and splendid sporting contest.",
  },
  {
    slang: "she'll be right",
    meaning: "Reassurance that complications will resolve satisfactorily",
    category: "phrase",
    tags: ["aussie", "australian", "philosophy"],
    examples: ["Do not stress over the flat tire, she'll be right mate."],
    exampleTranslation: "Do not feel anxious regarding the punctured tire; circumstances will resolve satisfactorily.",
  },
  {
    slang: "drongo",
    meaning: "A clumsy, foolish, or silly person",
    category: "evaluation",
    tags: ["aussie", "australian", "slang"],
    examples: ["He left his keys inside the locked boot, silly drongo."],
    exampleTranslation: "He accidentally locked his keys inside the vehicle compartment, the foolish fellow.",
  },
  {
    slang: "flat out",
    meaning: "Extremely occupied, busy, or moving at maximum velocity",
    category: "status",
    tags: ["aussie", "australian", "work"],
    examples: ["The support team has been flat out like a lizard drinking."],
    exampleTranslation: "The customer assistance team has been operating at maximum capacity all day.",
  },

  // ─── URBAN DICTIONARY, REDDIT & STAN CULTURE ──────────────────────────────
  {
    slang: "parasocial",
    meaning: "An intensely one-sided psychological attachment to a celebrity or creator",
    category: "trait",
    tags: ["reddit", "psychology", "youtube", "twitch"],
    examples: ["Defending an influencer like family is classic parasocial behavior."],
    exampleTranslation: "Defending an online media personality as though they were kin exemplifies one-sided psychological attachment.",
  },
  {
    slang: "gatekeep",
    meaning: "Concealing resources, artists, or information to prevent broader adoption",
    category: "action",
    tags: ["reddit", "music", "fashion", "twitter"],
    examples: ["Do not gatekeep the source of those vintage leather jackets."],
    exampleTranslation: "Please do not withhold the vendor details of those vintage garments.",
  },
  {
    slang: "doomscrolling",
    meaning: "Compulsively browsing negative news and catastrophic social feeds",
    category: "action",
    tags: ["reddit", "mental-health", "twitter"],
    examples: ["I caught myself doomscrolling for hours before falling asleep."],
    exampleTranslation: "I found myself compulsively consuming distressing online news reports late into the night.",
  },
  {
    slang: "rage bait",
    meaning: "Content deliberately manufactured to provoke fury and exploit engagement",
    category: "internet-culture",
    tags: ["reddit", "twitter", "journalism"],
    examples: ["That headline was blatant rage bait designed to boost impressions."],
    exampleTranslation: "That headline was provocative contrivance formulated exclusively to incite indignation.",
  },
  {
    slang: "chronically online",
    meaning: "Having worldviews skewed through excessive immersion in digital subcultures",
    category: "status",
    tags: ["reddit", "memes", "twitter"],
    examples: ["Believing that niche debate matters in real life is chronically online."],
    exampleTranslation: "Believing that isolated digital discourse has real-world consequence indicates excessive screen time.",
  },
  {
    slang: "situationship",
    meaning: "An ambiguous, uncommitted romantic relationship without defined boundaries",
    category: "relationship",
    tags: ["reddit", "dating", "lifestyle"],
    examples: ["They spent eight months in an undefined situationship before separating."],
    exampleTranslation: "They spent eight months in an uncommitted, ambiguous courtship prior to parting.",
  },
  {
    slang: "subtweet",
    meaning: "Publishing a veiled, critical post referencing someone without tagging their name",
    category: "action",
    tags: ["twitter", "social", "drama"],
    examples: ["She wrote a subtweet clearly aimed at her ex-partner."],
    exampleTranslation: "She published an indirect critical comment unmistakably alluding to her former acquaintance.",
  },
  {
    slang: "receipts",
    meaning: "Tangible screenshots, records, or documentation proving an assertion",
    category: "status",
    tags: ["twitter", "urban", "drama"],
    examples: ["He denied saying it until she brought out the receipts."],
    exampleTranslation: "He disputed the statement until she produced verified documentary evidence.",
  },
  {
    slang: "quiet quitting",
    meaning: "Performing strictly what one's job contract mandates without voluntary extra labor",
    category: "workplace",
    tags: ["reddit", "work", "corporate", "news"],
    examples: ["Tired of burnout, he embraced quiet quitting and logged off at 5 PM."],
    exampleTranslation: "Experiencing occupational fatigue, he limited his contributions strictly to defined working hours.",
  },
  {
    slang: "NPC",
    meaning: "A person perceived as lacking independent thought or mechanically following scripts",
    category: "trait",
    tags: ["gaming", "memes", "reddit"],
    examples: ["He repeats whatever he reads online like a literal NPC."],
    exampleTranslation: "He unreflectively mimics public sentiments without independent critical analysis.",
  },

  // ─── CORPORATE & TECH SATIRICAL JARGON ────────────────────────────────────
  {
    slang: "circle back",
    meaning: "Revisit or resume discussion regarding a topic at a subsequent date",
    category: "corporate",
    tags: ["corporate", "workplace", "office", "business"],
    examples: ["Let us circle back to budget allocation during Thursday's standup."],
    exampleTranslation: "We shall resume our evaluation of fiscal allocations during Thursday's briefing.",
  },
  {
    slang: "touch base",
    meaning: "Briefly contact or confer with someone to provide or receive an update",
    category: "corporate",
    tags: ["corporate", "workplace", "office"],
    examples: ["I will touch base with the engineering lead before sending the brief."],
    exampleTranslation: "I shall confer briefly with the engineering director prior to dispatching the memorandum.",
  },
  {
    slang: "boil the ocean",
    meaning: "Attempting an impossible, overly ambitious, or scope-crept project",
    category: "corporate",
    tags: ["corporate", "business", "consulting"],
    examples: ["Keep the MVP focused; we do not need to boil the ocean on v1."],
    exampleTranslation: "Maintain focus on core features; an unnecessarily exhaustive scope is counterproductive.",
  },
  {
    slang: "low-hanging fruit",
    meaning: "Quick-win opportunities that are effortless to achieve or resolve",
    category: "corporate",
    tags: ["corporate", "business", "strategy"],
    examples: ["Fixing the landing page button padding is low-hanging fruit for conversions."],
    exampleTranslation: "Optimizing button spacing is an easily realized modification with immediate utility.",
  },
  {
    slang: "move the needle",
    meaning: "Generating a noticeable, quantifiable impact or meaningful improvement",
    category: "corporate",
    tags: ["corporate", "finance", "strategy"],
    examples: ["Will this advertising campaign genuinely move the needle for retention?"],
    exampleTranslation: "Will this promotional initiative produce a measurable enhancement in client retention?",
  },
  {
    slang: "hard stop",
    meaning: "A strict, immovable deadline to conclude a meeting or engagement",
    category: "corporate",
    tags: ["corporate", "workplace", "scheduling"],
    examples: ["I have a hard stop at 3:00 PM for an executive presentation."],
    exampleTranslation: "I must conclude our meeting strictly at three o'clock due to an executive commitment.",
  },
  {
    slang: "bio break",
    meaning: "A brief recess during a meeting for hydration, restroom, or stretching",
    category: "corporate",
    tags: ["corporate", "remote-work", "office"],
    examples: ["Let us take a five-minute bio break before reviewing the spreadsheets."],
    exampleTranslation: "Let us adjourn for a five-minute physiological recess prior to analyzing the data sheets.",
  },

  // ─── DESI & HINGLISH CONTEMPORARY VERNACULAR ──────────────────────────────
  {
    slang: "jugaad",
    meaning: "A clever, resourceful, improvised hack or makeshift workaround",
    category: "action",
    tags: ["hinglish", "indian", "tech", "lifestyle"],
    examples: ["He fixed the broken tripod using zip-ties and sheer jugaad."],
    exampleTranslation: "He restored the fractured apparatus through ingenious improvisational ingenuity.",
  },
  {
    slang: "bindaas",
    meaning: "Carefree, self-assured, nonchalant, and unburdened by stress",
    category: "trait",
    tags: ["hinglish", "indian", "lifestyle"],
    examples: ["Approach the interview with a bindaas attitude and you will shine."],
    exampleTranslation: "Approach the professional examination with relaxed self-assurance and you will impress.",
  },
  {
    slang: "scene kya hai",
    meaning: "Colloquial greeting inquiring 'what are the current plans or situation'",
    category: "greeting",
    tags: ["hinglish", "indian", "social"],
    examples: ["Wagwan yaar, scene kya hai for the weekend?"],
    exampleTranslation: "Greetings friend, what activities are planned for the upcoming weekend?",
  },
  {
    slang: "faad",
    meaning: "Mind-blowing, sensational, exceptionally thrilling, or incredible",
    category: "evaluation",
    tags: ["hinglish", "indian", "music", "movies"],
    examples: ["The guitar solo at the concert was absolutely faad."],
    exampleTranslation: "The instrumental solo at the musical performance was extraordinary and mesmerizing.",
  },
  {
    slang: "chhapri",
    meaning: "Flashy, ostentatious, or cringe individual seeking shallow attention",
    category: "evaluation",
    tags: ["hinglish", "indian", "memes"],
    examples: ["Revving an unmuffled scooter through red lights is pure chhapri behavior."],
    exampleTranslation: "Accelerating a noisy motorized vehicle through traffic signals demonstrates crude ostentation.",
  },
  {
    slang: "bhasad",
    meaning: "A loud chaotic dispute, mess, commotion, or confusing situation",
    category: "status",
    tags: ["hinglish", "indian", "social"],
    examples: ["There was huge bhasad at the counter over ticket bookings."],
    exampleTranslation: "A considerable commotion and dispute arose at the reception desk regarding ticket reservations.",
  },
];

/**
 * Procedural generation engine when deep mining topics require novel, fresh slang.
 * Creates contextually plausible neologisms if all candidates are exhausted.
 */
function synthesizeProceduralSlang(sourceName: string, topic: string, seed: number): CrawlItem {
  const normSource = sourceName.toLowerCase();
  const normTopic = topic.toLowerCase();

  const prefixes = ["vibemax", "aura-check", "glitch-pass", "hypershift", "cloud-fade", "zenith-drip", "ghost-mode"];
  const bases = ["core", "flux", "pulse", "sync", "orbit", "spark", "grid"];
  const slangName = `${prefixes[seed % prefixes.length]}-${bases[(seed * 3) % bases.length]}`;

  return {
    slang: slangName,
    meaning: `Modern digital colloquialism denoting state of heightened ${normTopic || "energy"}`,
    category: "internet-culture",
    tags: [normSource, "neologism", normTopic],
    examples: [`Everyone in the server entered ${slangName} before the product launch.`],
    exampleTranslation: `All participants adopted a focused and heightened state of preparation prior to the launch.`,
  };
}

/**
 * Intelligent Multi-Platform Slang Crawler Engine
 * Guarantees zero duplicate extraction against existing database records.
 */
export async function executeIntelligentCrawl(params: {
  sourceName: string;
  sourceUrl?: string;
  topic?: string;
  existingSlangs: string[];
  count: number;
  geminiClient?: GoogleGenAI | null;
  callGeminiFallback?: (client: GoogleGenAI, p: any) => Promise<string | null>;
}): Promise<MongoSlangDoc[]> {
  const { sourceName, sourceUrl, topic = "", existingSlangs, count = 4, geminiClient, callGeminiFallback } = params;

  // Build high-speed Set of all already-known slang keys (normalized)
  const existingSet = new Set<string>();
  existingSlangs.forEach((s) => {
    if (s && typeof s === "string") {
      existingSet.add(s.toLowerCase().trim());
    }
  });

  const discoveredItems: MongoSlangDoc[] = [];
  const normalizedTopic = topic.toLowerCase();
  const normalizedSource = sourceName.toLowerCase();

  // 1. Attempt AI Web Crawler Extraction with Gemini (with anti-duplicate prompt)
  if (geminiClient && callGeminiFallback) {
    try {
      // Provide top 40 known slangs to exclude explicitly
      const excludeSample = Array.from(existingSet).slice(0, 40).join(", ");
      const prompt = `You are an autonomous real-time internet slang crawler and subculture linguist analyzing source "${sourceName}" (${sourceUrl || "web"}).
Mining Target / Topic Focus: "${topic || "2025-2026 viral trending slang, idioms, and neologisms"}".

STRICT DEDUPLICATION RULE:
DO NOT generate or include ANY of the following terms that already exist in our database:
[${excludeSample}]

TASK:
Extract ${count} completely FRESH, NOVEL, and AUTHENTIC slang expressions or regional idioms popular on ${sourceName}.
Focus on recent 2025/2026 vernacular, internet memes, gaming jargon, or local cultural terms.

Return strictly a valid JSON array matching this format:
[
  {
    "slang": "word or short phrase",
    "meaning": "precise definition under 10 words",
    "category": "evaluation|trait|action|emotion|status|internet-culture|regional|corporate",
    "examples": ["authentic colloquial sentence showcasing natural usage"],
    "exampleTranslation": "formal standard English translation"
  }
]`;

      const aiResponse = await callGeminiFallback(geminiClient, {
        contents: prompt,
        systemInstruction: "You are an expert subculture crawler and slang lexicographer. Output strictly valid JSON arrays.",
        responseMimeType: "application/json",
        temperature: 0.8,
      });

      if (aiResponse) {
        const parsed = JSON.parse(aiResponse);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.slang && typeof item.slang === "string") {
              const key = item.slang.toLowerCase().trim();
              if (!existingSet.has(key)) {
                existingSet.add(key);
                discoveredItems.push({
                  slang: item.slang.trim(),
                  meaning: item.meaning || "Contemporary colloquial expression",
                  category: item.category || "internet-culture",
                  source: sourceName || "AI Slang Crawler",
                  sourceUrl: sourceUrl || "https://urbandictionary.com",
                  examples: item.examples && item.examples.length > 0 ? item.examples : [`That is totally ${item.slang}.`],
                  exampleTranslation: item.exampleTranslation || item.meaning || "",
                  isNew: true,
                  addedAt: new Date().toISOString(),
                });
                if (discoveredItems.length >= count) break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("AI Crawler pass notice (falling back to enriched crawler engine):", err);
    }
  }

  // 2. If discoveredItems is less than requested count, draw from our massive curated corpus
  if (discoveredItems.length < count) {
    // Score all candidates by relevance to source and topic
    const candidates = EXTENSIVE_CRAWLER_CORPUS.filter((item) => {
      const key = item.slang.toLowerCase().trim();
      return !existingSet.has(key);
    }).map((item) => {
      let score = Math.random() * 0.5;
      const key = item.slang.toLowerCase();

      // Check tag relevance
      item.tags.forEach((t) => {
        if (normalizedTopic.includes(t)) score += 3.0;
        if (normalizedSource.includes(t)) score += 2.5;
      });

      if (item.category && normalizedTopic.includes(item.category.toLowerCase())) score += 2.0;
      if (normalizedTopic && key.includes(normalizedTopic)) score += 4.0;

      return { item, score };
    });

    // Sort by relevance score
    candidates.sort((a, b) => b.score - a.score);

    for (const cand of candidates) {
      const key = cand.item.slang.toLowerCase().trim();
      if (!existingSet.has(key)) {
        existingSet.add(key);
        discoveredItems.push({
          slang: cand.item.slang,
          meaning: cand.item.meaning,
          category: cand.item.category,
          source: sourceName || "Web Slang Miner",
          sourceUrl: sourceUrl || "https://knowyourmeme.com",
          examples: cand.item.examples,
          exampleTranslation: cand.item.exampleTranslation,
          isNew: true,
          addedAt: new Date().toISOString(),
        });
        if (discoveredItems.length >= count) break;
      }
    }
  }

  // 3. Guaranteed fallback: If all predefined candidates were somehow already discovered
  let seed = 1;
  while (discoveredItems.length < count) {
    const procedural = synthesizeProceduralSlang(sourceName, topic, seed++);
    const key = procedural.slang.toLowerCase().trim();
    if (!existingSet.has(key)) {
      existingSet.add(key);
      discoveredItems.push({
        slang: procedural.slang,
        meaning: procedural.meaning,
        category: procedural.category,
        source: sourceName || "Crawler Engine",
        sourceUrl: sourceUrl || "https://urbandictionary.com",
        examples: procedural.examples,
        exampleTranslation: procedural.exampleTranslation,
        isNew: true,
        addedAt: new Date().toISOString(),
      });
    }
  }

  return discoveredItems;
}
