#!/usr/bin/env node
/**
 * ask-index.mjs -- `npm run ask:index` (#1926): build the local index that
 * `npm run ask` answers from.
 *
 * Every file git tracks that is project knowledge (scripts/lib/ask-core.mjs
 * isKnowledge) is split into passages and embedded by Ollama on this machine.
 * Nothing leaves the machine. The index is data/ask-index/ (git-ignored):
 *   meta.json    -- model, dimension, per-file hash, and every passage's text
 *   vectors.bin  -- the passage vectors, Float32, row after row
 *
 * Incremental: a file whose contents are unchanged keeps its vectors, so a
 * rebuild after a day's work embeds only what changed.
 *
 *   npm run ask:index            # build or update
 *   npm run ask:index -- --full  # re-embed everything (after changing model)
 *
 * Needs Ollama running with the embedding model pulled:
 *   ollama pull nomic-embed-text      (or set WB_ASK_EMBED_MODEL)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { isKnowledge, chunkFile, embedText } from './lib/ask-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'ask-index');
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const EMBED_MODEL = process.env.WB_ASK_EMBED_MODEL || 'nomic-embed-text';
const BATCH = 32;
const full = process.argv.includes('--full');

async function embed(texts) {
  const res = await fetch(`${HOST}/api/embed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (/not found/i.test(body)) throw new Error(`Ollama has no model "${EMBED_MODEL}". Run: ollama pull ${EMBED_MODEL}`);
    throw new Error(`Ollama /api/embed answered ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()).embeddings;
}

async function main() {
  try { await fetch(`${HOST}/api/tags`); } catch {
    throw new Error(`Ollama is not running at ${HOST}. Start it (open the Ollama app, or run: ollama serve).`);
  }

  // Previous index, reused per file when its hash is unchanged.
  let prev = null;
  let prevVectors = null;
  if (!full && fs.existsSync(path.join(OUT, 'meta.json'))) {
    prev = JSON.parse(fs.readFileSync(path.join(OUT, 'meta.json'), 'utf8'));
    if (prev.embedModel !== EMBED_MODEL) prev = null;
    else prevVectors = new Float32Array(fs.readFileSync(path.join(OUT, 'vectors.bin')).buffer.slice(0));
  }

  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter((f) => f && isKnowledge(f));

  const chunks = [];       // every passage, in file order
  const vectors = [];      // matching vectors (null = still to embed)
  const hashes = {};
  let reused = 0;
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { continue; }
    if (text.length > 400_000) continue; // a generated blob, not prose
    const hash = crypto.createHash('sha1').update(text).digest('hex');
    hashes[f] = hash;
    const old = prev && prev.files[f] === hash ? prev.chunks.map((c, i) => [c, i]).filter(([c]) => c.file === f) : null;
    if (old && old.length) {
      for (const [c, i] of old) { chunks.push(c); vectors.push(prevVectors.subarray(i * prev.dim, (i + 1) * prev.dim)); }
      reused += old.length;
      continue;
    }
    for (const c of chunkFile(f, text)) { chunks.push(c); vectors.push(null); }
  }

  const todo = vectors.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  console.log(`[ask:index] ${files.length} files, ${chunks.length} passages: ${reused} reused, ${todo.length} to embed with ${EMBED_MODEL}`);
  const started = Date.now();
  for (let b = 0; b < todo.length; b += BATCH) {
    const ids = todo.slice(b, b + BATCH);
    const out = await embed(ids.map((i) => embedText(chunks[i])));
    ids.forEach((i, j) => { vectors[i] = Float32Array.from(out[j]); });
    if ((b / BATCH) % 10 === 0 || b + BATCH >= todo.length) {
      const done = Math.min(b + BATCH, todo.length);
      const secs = (Date.now() - started) / 1000;
      const eta = done ? Math.round((secs / done) * (todo.length - done)) : 0;
      process.stdout.write(`\r[ask:index] embedded ${done}/${todo.length}  (about ${eta}s left)   `);
    }
  }
  if (todo.length) process.stdout.write('\n');

  const dim = vectors.length ? vectors[0].length : 0;
  const flat = new Float32Array(vectors.length * dim);
  vectors.forEach((v, i) => flat.set(v, i * dim));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'vectors.bin'), Buffer.from(flat.buffer));
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({
    builtAt: new Date().toISOString(), embedModel: EMBED_MODEL, dim, files: hashes, chunks,
  }));
  console.log(`[ask:index] wrote data/ask-index/ (${chunks.length} passages, ${dim} dimensions)`);
}

main().catch((e) => { console.error(`[ask:index] ${e.message}`); process.exit(1); });
