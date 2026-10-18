/**
 * ask-core.mjs -- the pure parts of `npm run ask` (#1926): which files are
 * project knowledge, how a file becomes passages, how passages are ranked
 * against a question, and the prompt that keeps the model to them.
 *
 * No I/O against Ollama here, so tests/regression/ask-chunks-and-ranks.spec.ts
 * runs in CI without a model.
 */

/** Tracked files that are project knowledge. Generated data and archive/ are not. */
export const KNOWLEDGE_EXT = /\.(md|js|mjs|ts|json|html|css|yml|yaml)$/i;
const SKIP = [
  /^archive\//,
  /^node_modules\//,
  /(^|\/)package-lock\.json$/,
  // Generated indexes and reports: big, derived from files already indexed.
  /^data\/(?!behavior-examples\.json$)/,
  /\.min\.(js|css)$/,
];

export function isKnowledge(file) {
  return KNOWLEDGE_EXT.test(file) && !SKIP.some((rx) => rx.test(file));
}

/** Passages of about this many characters; a passage never splits a line. */
export const CHUNK_CHARS = 1500;

/**
 * A file as passages. Every line lands in exactly one passage, in order. A
 * markdown heading starts a new passage, and each passage carries the nearest
 * heading above it, so an answer can say where in the file it came from.
 *
 * @param {string} file  repo-relative path
 * @param {string} text  file contents
 * @returns {{ file: string, heading: string, line: number, text: string }[]}
 */
export function chunkFile(file, text, size = CHUNK_CHARS) {
  const lines = text.split(/\r?\n/);
  const isMd = /\.md$/i.test(file);
  const out = [];
  let buf = [];
  let len = 0;
  let start = 1;
  let heading = '';
  let bufHeading = '';
  const flush = () => {
    const body = buf.join('\n');
    if (body.trim()) out.push({ file, heading: bufHeading, line: start, text: body });
    buf = [];
    len = 0;
  };
  lines.forEach((line, i) => {
    const h = isMd && /^#{1,6}\s+(.*)$/.exec(line);
    if ((h && buf.length) || (len + line.length > size && buf.length)) {
      flush();
      start = i + 1;
    }
    if (h) heading = h[1].trim();
    if (!buf.length) { start = i + 1; bufHeading = heading; }
    buf.push(line);
    len += line.length + 1;
  });
  flush();
  return out;
}

/** The text that is embedded for a passage: where it is, then what it says. */
export function embedText(chunk) {
  return `${chunk.file}${chunk.heading ? ' > ' + chunk.heading : ''}\n${chunk.text}`;
}

/** Cosine similarity of two equal-length vectors. */
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * The indexes of the k passages closest to the question, closest first.
 * @param {ArrayLike<number>} q  question vector
 * @param {Float32Array} vectors  all passage vectors, row after row
 * @param {number} dim
 */
export function topK(q, vectors, dim, k = 8) {
  const n = vectors.length / dim;
  const scores = [];
  for (let i = 0; i < n; i++) scores.push([i, cosine(q, vectors.subarray(i * dim, (i + 1) * dim))]);
  return scores.sort((x, y) => y[1] - x[1]).slice(0, k);
}

/**
 * Keyword search (#1938). Search by meaning alone missed the project's own code:
 * "how do I read and save a JSON file" ranked package.json first, because the
 * code that does it says readFileSync and writeFileSync, not "read" and "save".
 * Identifiers are split at camelCase and punctuation, so readFileSync also
 * counts as read, file and sync.
 */
const STOP = new Set(('a an and are as at be by can do does for from how i if in into is it '
  + 'its me my of on or so that the then this to use using what when where which with you').split(' '));

export function tokenize(text) {
  const out = [];
  for (const word of String(text).match(/[A-Za-z][A-Za-z0-9]*/g) || []) {
    const lower = word.toLowerCase();
    out.push(lower);
    const parts = word.split(/(?<=[a-z0-9])(?=[A-Z])/);
    if (parts.length > 1) for (const p of parts) out.push(p.toLowerCase());
  }
  return out.filter((t) => t.length > 1 && !STOP.has(t));
}

/** Everyday words in a question, and the words the project's code uses for them. */
export const TERM_MAP = {
  save: ['write', 'writefilesync', 'writefile'],
  store: ['write'],
  load: ['read', 'readfilesync'],
  open: ['read'],
  change: ['write'],
  edit: ['write'],
  update: ['write'],
  modify: ['write'],
  read: ['readfilesync', 'readfile'],
  write: ['writefilesync', 'writefile'],
  parse: ['parse', 'stringify'],
  folder: ['dir', 'readdirsync', 'mkdirsync'],
  directory: ['dir', 'readdirsync'],
  delete: ['unlinksync', 'rmsync'],
  remove: ['unlinksync', 'rmsync'],
};

/** The keyword query for a question: its own words plus the project's words for them. */
export function queryTerms(question) {
  const terms = tokenize(question);
  for (const t of [...terms]) if (TERM_MAP[t]) terms.push(...TERM_MAP[t]);
  return [...new Set(terms)];
}

/**
 * Okapi BM25 score of every passage for the query terms.
 * @param {string[]} terms
 * @param {string[][]} docs  each passage, tokenized
 */
export function bm25(terms, docs, k1 = 1.2, b = 0.75) {
  const n = docs.length;
  const avg = docs.reduce((s, d) => s + d.length, 0) / (n || 1);
  const df = new Map(terms.map((t) => [t, 0]));
  const tfs = docs.map((d) => {
    const tf = new Map();
    for (const t of d) if (df.has(t)) tf.set(t, (tf.get(t) || 0) + 1);
    for (const t of tf.keys()) df.set(t, df.get(t) + 1);
    return tf;
  });
  return tfs.map((tf, i) => {
    let s = 0;
    for (const [t, f] of tf) {
      const idf = Math.log(1 + (n - df.get(t) + 0.5) / (df.get(t) + 0.5));
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * docs[i].length / avg));
    }
    return s;
  });
}

/**
 * Both searches combined by reciprocal rank fusion: a passage near the top of
 * either list ranks well, and one near the top of both ranks best. Ranks, not
 * raw scores, so a cosine of 0.7 and a BM25 of 14 never have to be compared.
 * @param {number[]} meaning  cosine score per passage
 * @param {number[]} keyword  BM25 score per passage
 * @returns {[number, number][]}  [passage index, fused score], best first
 */
export function fuse(meaning, keyword, k = 8, c = 60) {
  const fused = new Float64Array(meaning.length);
  for (const scores of [meaning, keyword]) {
    const order = scores.map((s, i) => [i, s]).filter(([, s]) => s > 0).sort((x, y) => y[1] - x[1]);
    order.forEach(([i], rank) => { fused[i] += 1 / (c + rank + 1); });
  }
  return [...fused].map((s, i) => [i, s]).filter(([, s]) => s > 0).sort((x, y) => y[1] - x[1]).slice(0, k);
}

/**
 * The prompt: the passages, numbered with their source, and the rule that the
 * answer comes from them alone. The model is small; the knowledge is the
 * project's, so a question the passages do not answer is said to be
 * unanswered rather than guessed.
 */
export function buildPrompt(question, chunks) {
  const sources = chunks.map((c, i) =>
    `[${i + 1}] ${c.file}${c.heading ? ' > ' + c.heading : ''} (line ${c.line})\n${c.text}`).join('\n\n');
  const system = [
    'You answer questions about the WB-Starter project using ONLY the numbered sources below,',
    'which are excerpts of the project\'s own files.',
    'Cite the sources you used by number, like [2].',
    'If the sources do not contain the answer, say "The project files I found do not answer that."',
    'and do not guess. Keep the answer short and exact; quote attribute names and code as written.',
  ].join(' ');
  return { system, user: `Sources:\n\n${sources}\n\nQuestion: ${question}` };
}
