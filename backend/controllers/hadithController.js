// server.js
// Islamic Chatbot Backend (Express.js) — mirrors FastAPI logic (no Musnad Ahmad / Silsila Sahiha)
const axios = require("axios");
const stringSimilarity = require("string-similarity");

// =========
// API KEY (local testing). For prod: use process.env.HADITH_API_KEY
// =========
const HADITH_API_KEY = process.env.HADITH_API_KEY ||
  "";
const BASE = "https://hadithapi.com/api";

// -----------------------
// EXCLUDED BOOKS
// -----------------------
const EXCLUDED_SLUGS = new Set(["musnad-ahmad", "al-silsila-sahiha"]);
const EXCLUDED_NAMES = new Set([
  "musnad ahmad", "musnad ahmed",
  "al silsila sahiha", "silsila sahiha",
  "silsilah sahiha", "silsilah sahihah"
]);

// -----------------------
// LIGHTWEIGHT NLP (NO STEMMING IN QUERIES)
// -----------------------
let natural;
let USE_NATURAL = true;
try {
  natural = require("natural"); // has WordNet + WordTokenizer + WordNet Lemmatizer
  // We'll use WordNet for synonyms (like NLTK) if present.
} catch (e) {
  USE_NATURAL = false;
}

const FALLBACK_STOPWORDS = new Set(`
a an the and or if is are was were be been being have has had do does did of to in on at for from by with as that this these those i you he she it we they them his her their our
my your me him her us who whom which what when where why how not no nor so but into over under again further then once here there all any both each few more most other some such only
own same than too very can will just don should now
`.trim().split(/\s+/));

const STOPWORDS = FALLBACK_STOPWORDS; // keep it simple & deterministic

const LEMMATIZE = async (w) => {
  if (!USE_NATURAL) return w;
  // Use WordNet lemma approximation: fall back to original word
  // natural doesn't ship a one-call lemmatizer; we mimic with WordNet lookups
  try {
    const wn = new natural.WordNet();
    const lookups = await new Promise((resolve) => {
      wn.lookup(w, (results) => resolve(results || []));
    });
    if (lookups.length > 0) {
      // pick shortest lemma-like word
      const lemmas = [];
      for (const r of lookups) {
        if (Array.isArray(r.synonyms)) {
          for (let s of r.synonyms) {
            s = String(s || "").replace(/_/g, " ").toLowerCase();
            if (s && s.length > 2 && !STOPWORDS.has(s)) lemmas.push(s);
          }
        }
      }
      if (lemmas.length) {
        lemmas.sort((a, b) => a.length - b.length);
        return lemmas[0];
      }
    }
  } catch {}
  return w;
};

// Synonyms & Islamic concept expansion (extend as needed)
const SYNONYMS = {
  fight: ["quarrel", "argue", "argument", "conflict", "dispute"],
  anger: ["angry", "rage", "wrath", "temper"],
  wife: ["spouse", "woman", "partner"],
  respect: ["honor", "kindness", "good treatment", "rights"],
  rights: ["duties", "obligations"],
  alcohol: ["khamr", "intoxicant", "wine", "drinking"],
  women: ["woman", "wives", "female"],
  marriage: ["nikah", "spouse", "husband", "wife"],
  backbiting: ["gheebah", "slander"],
  arrogance: ["kibr", "pride", "haughtiness"],
  truthfulness: ["honesty", "truth", "sincerity"],
  parents: ["mother", "father", "obedience", "kindness to parents"],
};

const CONCEPT_MAP = {
  "rights of women": ["women rights", "respect women", "kindness to women", "wives", "marriage"],
  "fight with my wife": ["marriage", "wives", "kindness", "respect", "anger", "conflict"],
  disrespect: ["respect", "kindness", "good treatment"],
  "anger management": ["anger", "temper"],
  "respect your parents": ["parents", "obedience", "kindness to parents"],
};

// -----------------------
// BOOK NORMALIZATION (with fuzzy match but EXCLUDING the denied slugs)
// -----------------------
let BOOKS_CACHE = []; // [{name, slug}]
const BOOK_ALIASES = {
  // Common core collections only — intentionally excluding musnad-ahmad & al-silsila-sahiha
  "bukhari": "sahih-bukhari", "sahih bukhari": "sahih-bukhari",
  "muslim": "sahih-muslim", "sahih muslim": "sahih-muslim",
  "tirmidhi": "al-tirmidhi", "al tirmidhi": "al-tirmidhi",
  "abu dawud": "abu-dawood", "abu dawood": "abu-dawood",
  "ibn majah": "ibn-e-majah", "ibn-e-majah": "ibn-e-majah", "ibn maja": "ibn-e-majah",
  "nasai": "sunan-nasai", "an-nasai": "sunan-nasai", "annasai": "sunan-nasai", "sunan nasai": "sunan-nasai",
  "mishkat": "mishkat",
};

const normalizeBook = (name) => {
  if (!name) return null;
  let n = String(name).trim().toLowerCase().replace(/[–—]/g, "-");

  // hard block excluded names
  if (EXCLUDED_NAMES.has(n)) return null;

  // 1) exact alias map
  if (BOOK_ALIASES[n]) return BOOK_ALIASES[n];

  // 2) direct match to known slugs (excluding denied)
  for (const b of BOOKS_CACHE) {
    const slug = (b.slug || "").toLowerCase();
    if (EXCLUDED_SLUGS.has(slug)) continue;
    if (n === slug) return slug;
  }

  // 3) fuzzy match against names & slugs (excluding denied)
  const candidates = Array.from(new Set(
    BOOKS_CACHE
      .filter(b => !EXCLUDED_SLUGS.has((b.slug || "").toLowerCase()))
      .flatMap(b => [String(b.name || "").toLowerCase(), String(b.slug || "").toLowerCase()])
      .filter(Boolean)
  ));
  if (candidates.length) {
    const { bestMatch } = stringSimilarity.findBestMatch(n, candidates);
    if (bestMatch && bestMatch.rating >= 0.72) {
      const match = bestMatch.target;
      for (const b of BOOKS_CACHE) {
        const slug = (b.slug || "").toLowerCase();
        if (EXCLUDED_SLUGS.has(slug)) continue;
        if (String(b.name || "").toLowerCase() === match || slug === match) {
          return slug || null;
        }
      }
    }
  }

  // 4) fallback
  return null;
};

// -----------------------
// JSON SHAPE HELPERS
// -----------------------
function extractHadithList(apiJson) {
  if (typeof apiJson !== "object" || apiJson === null) return [];
  let value = apiJson.hadiths ?? apiJson.data;
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value.data)) return value.data;
    for (const k of Object.keys(value)) {
      if (Array.isArray(value[k])) return value[k];
    }
  }
  return [];
}

function normalizeHit(h) {
  if (typeof h !== "object" || h === null) return null;
  const bookObj = h.book;
  let book_name = null, book_slug = null;
  if (bookObj && typeof bookObj === "object") {
    book_name = bookObj.bookName || h.bookName;
    book_slug = bookObj.bookSlug || h.bookSlug;
  } else if (typeof bookObj === "string") {
    book_name = bookObj;
    book_slug = h.bookSlug;
  } else {
    book_name = h.bookName;
    book_slug = h.bookSlug;
  }
  const hadith_number = h.hadithNumber || h.number || h.hadith_no;
  const chap = h.chapter;
  const chapter_number = chap && typeof chap === "object" ? chap.chapterNumber : h.chapterNumber;

  return {
    book: book_slug,
    bookName: book_name,
    hadithNumber: hadith_number,
    chapter: chapter_number,
    status: h.status,
    textArabic: h.hadithArabic || h.arabic || h.textArabic,
    textEnglish: h.hadithEnglish || h.english || h.textEnglish,
    textUrdu: h.hadithUrdu || h.urdu || h.textUrdu,
  };
}

async function getJSON(url) {
  const r = await axios.get(url, { timeout: 20000 });
  return r.data;
}

// -----------------------
// QUERY BUILDING
// -----------------------
function buildSearchUrl({
  keywords = null,
  book_slug = null,
  hadith_number = null,
  chapter = null,
  lang = "english",
  page_size = 5,
}) {
  const params = new URLSearchParams();
  params.set("apiKey", HADITH_API_KEY);
  params.set("paginate", String(page_size));
  if (book_slug) params.set("book", book_slug);
  if (hadith_number) params.set("hadithNumber", String(hadith_number));
  if (chapter) params.set("chapter", String(chapter));
  if (keywords) {
    const field = { english: "hadithEnglish", urdu: "hadithUrdu", arabic: "hadithArabic" }[lang] || "hadithEnglish";
    params.set(field, keywords); // IMPORTANT: single token, not a phrase
  }
  return `${BASE}/hadiths?${params.toString()}`;
}

// -----------------------
// NLP UTILITIES (no stemming in queries)
// -----------------------
const PUNCT_REGEX = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g;

function preprocess(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(PUNCT_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeRaw(text) {
  return preprocess(text).split(" ").filter(Boolean);
}

async function tokensCleanAndLemmatize(text) {
  const toks = tokenizeRaw(text).filter(t => !STOPWORDS.has(t) && t.length > 2);
  // lemmatize (no stemming)
  const out = [];
  for (const t of toks) out.push(await LEMMATIZE(t));
  return out;
}

function bigrams(tokens) {
  const arr = [];
  for (let i = 0; i < tokens.length - 1; i++) arr.push(`${tokens[i]} ${tokens[i + 1]}`);
  return arr;
}

async function expandWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  for (const t of tokens) {
    for (const base of Object.keys(SYNONYMS)) {
      const syns = SYNONYMS[base] || [];
      if (t === base || syns.includes(t)) {
        expanded.add(base);
        syns.forEach(s => expanded.add(s));
      }
    }
    if (USE_NATURAL) {
      try {
        const wn = new natural.WordNet();
        const synsets = await new Promise((resolve) => {
          wn.lookup(t, (results) => resolve(results || []));
        });
        for (const syn of synsets) {
          for (let lemma of (syn.synonyms || [])) {
            const w = String(lemma || "").replace(/_/g, " ").toLowerCase();
            if (w.length > 2 && !STOPWORDS.has(w)) {
              // we don't re-lemmatize here to keep it light
              expanded.add(w);
            }
          }
        }
      } catch {}
    }
  }
  return Array.from(expanded);
}

function mapConcepts(originalText) {
  const s = preprocess(originalText);
  const hits = [];
  for (const phrase of Object.keys(CONCEPT_MAP)) {
    if (s.includes(phrase)) hits.push(...CONCEPT_MAP[phrase]);
  }
  return hits;
}

async function makeQueryCandidates(userText) {
  const lemmas = await tokensCleanAndLemmatize(userText);
  if (!lemmas.length) return [];

  const cands = [];

  const shortOriginal = preprocess(userText);
  if (shortOriginal.split(" ").length >= 3 && shortOriginal.split(" ").length <= 5) {
    cands.push(shortOriginal);
  }

  const mapped = mapConcepts(userText);
  if (mapped.length) cands.push(mapped.join(" "));

  const expanded = await expandWithSynonyms(lemmas);
  if (expanded.length) cands.push(expanded.slice(0, 8).join(" "));

  const bgs = bigrams(lemmas);
  if (bgs.length) cands.push(bgs.slice(0, 5).join(" "));

  const topLemmas = Array.from(new Set(lemmas)).sort((a, b) => b.length - a.length).slice(0, 6);
  if (topLemmas.length) cands.push(topLemmas.join(" "));

  cands.push(...topLemmas.slice(0, 4));

  // dedupe preserving order
  const seen = new Set();
  const ordered = [];
  for (const q of cands) {
    const qn = String(q || "").trim();
    if (!qn || seen.has(qn)) continue;
    seen.add(qn);
    ordered.push(qn);
  }
  return ordered;
}

// -----------------------
// DEDUPE & PRIORITY
// -----------------------
function dedupeHits(hits) {
  const seen = new Set();
  const out = [];
  for (const h of hits || []) {
    if (!h || typeof h !== "object") continue;
    const bookSlug = String(h.bookSlug || (h.book || {}).bookSlug || h.book || "");
    const num = String(h.hadithNumber || h.number || h.hadith_no || "");
    const key = `${bookSlug}::${num}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(h);
    }
  }
  return out;
}

const PRIORITY_TOKENS = new Set([
  "marriage","wife","wives","husband","women","respect","anger","parents",
  "truth","honesty","alcohol","khamr","backbiting","gheebah"
]);

// ----------------
// API Endpoints (refactored to exported handlers instead of using app.* here)
// ----------------
// NOTE: Routes are registered in routes/hadithRoutes.js with prefix '/api/hadith'
// Expected final endpoints:
//  GET    /api/hadith/books             -> listBooks
//  POST   /api/hadith/hadith/search     -> searchHadiths (keeps existing frontend path)
//  POST   /api/hadith/answer            -> generateAnswer

async function listBooks(_req, res) {
  const url = `${BASE}/books?apiKey=${encodeURIComponent(HADITH_API_KEY)}`;
  try {
    const data = await getJSON(url);
    let booksRaw = data.books || data.data || [];
    if (typeof booksRaw === "object" && booksRaw && Array.isArray(booksRaw.data)) {
      booksRaw = booksRaw.data;
    }
    const books = [];
    for (const b of booksRaw || []) {
      const name = (typeof b === "object" && b) ? b.bookName : String(b);
      const slug = (typeof b === "object" && b) ? b.bookSlug : null;
      if (!name) continue;
      if (slug && EXCLUDED_SLUGS.has(String(slug).toLowerCase())) continue;
      books.push({ name, slug });
    }
    // update global cache for fuzzy matching (already excluding denied)
    BOOKS_CACHE = books;
    res.json(books);
  } catch (e) {
    res.status(502).json({ detail: "Failed to load books from Hadith API" });
  }
}

// ----------------
// REFERENCE / TOPIC PARSER
// ----------------
function parseUserQuery(q) {
  // Returns:
  //   - {kind:'reference', bookSlug?, hadithNumber?}
  //   - {kind:'reference', bookSlug?, chapter, chapterItem}
  //   - {kind:'topic', text}
  let s = String(q || "").trim().toLowerCase();
  s = s.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

  // 1) Chapter style: "Book 7:10"
  let m = s.match(/^([a-z\s'\.-]+?)\s+(\d{1,6})\s*:\s*(\d{1,4})$/);
  if (m) {
    let bookSlug = normalizeBook(m[1]);
    if (EXCLUDED_SLUGS.has(bookSlug) || EXCLUDED_NAMES.has(m[1].trim().toLowerCase())) bookSlug = null;
    return { kind: "reference", bookSlug, chapter: parseInt(m[2], 10), chapterItem: parseInt(m[3], 10) };
  }

  // 2) Flexible "Book <sep> number"
  m = s.match(/^([a-z\s'\.-]+?)\s*(?:no\.?\s*#?\s*|no\s*#?\s*|#|-|\s)\s*(\d{1,6})$/);
  if (m) {
    const rawBook = m[1].trim().toLowerCase();
    let bookSlug = normalizeBook(rawBook);
    if ((bookSlug && EXCLUDED_SLUGS.has(bookSlug)) || EXCLUDED_NAMES.has(rawBook)) {
      bookSlug = null;
    }
    return { kind: "reference", bookSlug, hadithNumber: parseInt(m[2], 10) };
  }

  // 3) Pure number
  if (/^\d{1,6}$/.test(s)) return { kind: "reference", hadithNumber: parseInt(s, 10) };

  // 4) Topic
  return { kind: "topic", text: q };
}

// ----------------
// HADITH SEARCH
// ----------------
async function searchHadiths(req, res) {
  const payload = req.body || {};
  const query = payload.query || "";
  let bookSlugParam = payload.bookSlug || null;

  if (bookSlugParam && EXCLUDED_SLUGS.has(String(bookSlugParam).toLowerCase())) {
    return res.json({ hits: [], noBookMatch: true });
  }

  bookSlugParam = bookSlugParam ? normalizeBook(bookSlugParam) : null;
  const lang = payload.lang || "english";
  const pageSize = Math.max(1, parseInt(payload.pageSize || 5, 10));
  const parsed = parseUserQuery(query);

  let hits_raw = [];
  let noBookMatch = false;

  try {
    if (parsed.kind === "reference") {
      const refBook = parsed.bookSlug;
      if (bookSlugParam && refBook && refBook !== bookSlugParam) {
        noBookMatch = true;
        hits_raw = [];
      } else {
        const effective_book = refBook || bookSlugParam;
        if (effective_book && EXCLUDED_SLUGS.has(String(effective_book).toLowerCase())) {
          noBookMatch = true;
          hits_raw = [];
        } else {
          if (parsed.hadithNumber) {
            const url = buildSearchUrl({
              hadith_number: parsed.hadithNumber,
              book_slug: effective_book,
              page_size: pageSize,
            });
            const data = await getJSON(url);
            hits_raw = extractHadithList(data);
          } else if (parsed.chapter && parsed.chapterItem) {
            const url = buildSearchUrl({
              chapter: parsed.chapter,
              book_slug: effective_book,
              page_size: 50,
            });
            const data = await getJSON(url);
            const arr = extractHadithList(data);
            const idx = parseInt(parsed.chapterItem, 10) - 1;
            hits_raw = (idx >= 0 && idx < arr.length) ? [arr[idx]] : [];
          }
          if (bookSlugParam && (!hits_raw || hits_raw.length === 0)) {
            noBookMatch = true;
          }
        }
      }
    } else {
      const candidates = await makeQueryCandidates(parsed.text);
      const MAX_UNIQUE = pageSize;
      const MAX_ATTEMPTS = 12;
      let attempts = 0;
      let aggregated = [];

      const prioritize = (tokens) =>
        Array.from(new Set(tokens))
          .sort((a, b) => {
            const aPri = PRIORITY_TOKENS.has(a.toLowerCase()) ? 0 : 1;
            const bPri = PRIORITY_TOKENS.has(b.toLowerCase()) ? 0 : 1;
            if (aPri !== bPri) return aPri - bPri;
            return b.length - a.length;
          });

      outer: for (const cand of candidates) {
        if (attempts >= MAX_ATTEMPTS || aggregated.length >= MAX_UNIQUE) break;
        let tokens = String(cand || "").split(/\s+/).filter(t => t.length > 2);
        tokens = prioritize(tokens);
        for (const tok of tokens) {
          if (attempts >= MAX_ATTEMPTS || aggregated.length >= MAX_UNIQUE) break;
          const url = buildSearchUrl({
            keywords: tok,
            book_slug: bookSlugParam,
            lang,
            page_size: MAX_UNIQUE,
          });
          try {
            const data = await getJSON(url);
            attempts += 1;
            const part = extractHadithList(data);
            if (Array.isArray(part) && part.length) {
              aggregated = dedupeHits(aggregated.concat(part)).slice(0, MAX_UNIQUE);
              if (aggregated.length >= MAX_UNIQUE) break outer;
            }
          } catch (e) {
            attempts += 1;
            continue;
          }
        }
      }
      hits_raw = aggregated;
      if (bookSlugParam && (!hits_raw || hits_raw.length === 0)) {
        noBookMatch = true;
      }
    }
  } catch (e) {
    hits_raw = [];
  }

  const norm = [];
  for (const h of hits_raw || []) {
    const nh = normalizeHit(h);
    if (nh) norm.push(nh);
  }

  res.json({ hits: norm, noBookMatch });
}

function generateAnswer(req, res) {
  const payload = req.body || {};
  const question = payload.question || "";
  const apiResult = payload.apiResult || { hits: [], noBookMatch: false };
  const no_match_note = apiResult.noBookMatch ? "No Hadith related to your query found in that book." : "";

  const lines = [`Question: ${question}`, ""];
  if (apiResult.hits && apiResult.hits.length) {
    lines.push("Hadith references:");
    for (const h of apiResult.hits.slice(0, 3)) {
      const ref = `${(h.bookName || h.book || "Unknown")} #${h.hadithNumber}`;
      lines.push(`- ${ref}`);
    }
    lines.push("");
    lines.push("Hadith texts:");
  } else {
    lines.push("No hadith matched. Provide general Islamic guidance without quoting hadith.");
  }
  if (no_match_note) {
    lines.push("");
    lines.push(no_match_note);
  }
  res.json({ answer: lines.join("\n") });
}

module.exports = { listBooks, searchHadiths, generateAnswer };
