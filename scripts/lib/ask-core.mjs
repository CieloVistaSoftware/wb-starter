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
 * The prompt: the passages, numbered with their source, and the rule that the
 * answer comes from them alone. The model is small; the knowledge is the
 * project's, so a question the passages do not answer is said to be
 * unanswered rather than guessed.
 */
export function buildPrompt(question, chunks) {
  const sources = chunks.map((c, i) =>
    `[${i + 1}] ${c.file}${c.heading ? ' > ' + c.heading : ''} (line ${c.line})\n${c.text}`).join('\n\n');
  const system = [
    'You answer questions about the wb-starter project using ONLY the numbered sources below,',
    'which are excerpts of the project\'s own files.',
    'Cite the sources you used by number, like [2].',
    'If the sources do not contain the answer, say "The project files I found do not answer that."',
    'and do not guess. Keep the answer short and exact; quote attribute names and code as written.',
  ].join(' ');
  return { system, user: `Sources:\n\n${sources}\n\nQuestion: ${question}` };
}
