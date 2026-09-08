import { Case } from "../models/Case.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "for", "with", "about", "from", "into",
  "this", "that", "these", "those", "was", "were", "been", "being", "have",
  "has", "had", "did", "does", "doing", "will", "would", "can", "could", "all",
  "some", "any", "my", "our", "your", "their", "his", "her", "its", "on", "in",
  "at", "to", "of", "is", "are", "it", "as", "also", "when", "why", "how", "who",
]);

const CATEGORY_KEYWORDS = {
  academic: [
    "grade", "mark", "exam", "result", "credit", "cgpa", "gpa", "semester",
    "course", "quiz", "assignment", "thesis", "viva", "attendance", "syllabus",
    "prerequisite", "transcript", "batch", "counsel", "class schedule", "section",
  ],
  faculty_conduct: [
    "professor", "teacher", "faculty", "conduct", "behavior", "rude", "mistreat",
    "insult", "partial", "favoritism", "unprofessional", "ignores", "neglect",
    "behaviour", "demeanor", "attitude",
  ],
  facility: [
    "classroom", "lab", "laboratory", "wifi", "internet", "fan", "light", "ac",
    "air conditioner", "projector", "furniture", "room", "toilet", "washroom",
    "water", "building", "socket", "equipment", "bench", "whiteboard", "cleaning",
    "maintenance", "power", "electricity",
  ],
  administration: [
    "form", "fee", "scholarship", "waiver", "registration", "certificate",
    "document", "office", "stipend", "admission", "permission", "submit",
    "approval", "delay", "administrative", "registrar", "billing", "refund",
  ],
  harassment: [
    "harass", "abuse", "threat", "bully", "intimidat", "discriminat", "sexual",
    "gender", "racist", "bullying", "coerce", "pressure", "fear", "unsafe",
    "misconduct", "unwanted",
  ],
};

const ACTIVE_STATUSES = [
  "submitted", "acknowledged", "under_review", "investigation", "action_taken",
];

function normalize(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w) && w.length > 1);
}

function countMatches(keywords, tokens) {
  return keywords.reduce((sum, kw) => {
    if (kw.length > 1) {
      return sum + (tokens.join(" ").includes(kw) ? 1 : 0);
    }
    return sum + (tokens.includes(kw) ? 1 : 0);
  }, 0);
}

export function suggestCategory(title, description) {
  const tokens = tokenize(`${title} ${title} ${description}`); // title weighted 2x
  const scored = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => ({
    category,
    score: countMatches(keywords, tokens),
  }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score === 0) return null;
  const total = scored.reduce((sum, s) => sum + s.score, 0);
  return {
    suggestedCategory: top.category,
    scores: scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => ({ category: s.category, score: total > 0 ? Math.round((s.score / total) * 100) : 0 })),
  };
}

function similarity(aTokens, bTokens) {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const setB = new Set(bTokens);
  const overlap = aTokens.filter((t) => setB.has(t)).length;
  return overlap / Math.min(aTokens.length, bTokens.length);
}

export async function findDuplicates(userId, role, title, description) {
  const filter = {
    status: { $in: ACTIVE_STATUSES },
    privacyMode: { $in: ["identified", "protected", "confidential"] },
  };

  // Students only see their own previous cases; staff see everything.
  if (!["hod", "admin"].includes(role)) {
    filter.submitterUserId = userId;
  }

  const candidates = await Case.find(filter)
    .select("_id caseId title description status privacyMode")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const titleTokens = tokenize(title);
  const descTokens = tokenize(`${title} ${description}`);

  const results = [];
  for (const c of candidates) {
    const candTitle = tokenize(c.title);
    const candDesc = tokenize(`${c.title} ${c.description}`);
    const score = Math.max(
      similarity(candTitle, titleTokens),
      similarity(candDesc, descTokens) * 0.9
    );
    if (score >= 0.5) {
      const matchTitle = normalize(c.title);
      results.push({
        _id: c._id,
        caseId: c.caseId,
        title: c.title,
        status: c.status,
        score: Math.round(score * 100),
        exactMatch: matchTitle === normalize(title) && matchTitle.length > 0,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

export async function analyzeCase(userId, role, { title, description }) {
  const categories = suggestCategory(title, description);
  const duplicates = await findDuplicates(userId, role, title, description);
  return {
    suggestedCategory: categories ? categories.suggestedCategory : null,
    categoryScores: categories ? categories.scores : [],
    duplicates,
  };
}