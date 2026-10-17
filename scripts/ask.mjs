#!/usr/bin/env node
/**
 * ask.mjs -- `npm run ask -- "question"` (#1926): answer a question from
 * WB-Starter's own files, on this machine, with the files it used.
 *
 * The question is embedded, the closest passages in data/ask-index/ (built by
 * `npm run ask:index`) are found, and a small local model answers from those
 * passages alone and cites them. It says so when the project has no answer.
 *
 *   npm run ask -- "how does x-autosize differ from textarea autosize?"
 *   npm run ask -- --sources "headingLevel"   # just list the closest passages
 *
 * Models (Ollama, local): WB_ASK_MODEL (default qwen2.5-coder:3b) answers,
 * WB_ASK_EMBED_MODEL (default nomic-embed-text, same as the index) searches.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { topK, buildPrompt } from './lib/ask-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'ask-index');
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.WB_ASK_MODEL || 'qwen2.5-coder:3b';
const K = Number(process.env.WB_ASK_PASSAGES || 8);

async function main() {
  const args = process.argv.slice(2);
  const sourcesOnly = args.includes('--sources');
  const question = args.filter((a) => a !== '--sources').join(' ').trim();
  if (!question) {
    console.log('Usage: npm run ask -- "your question about WB-Starter"');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(OUT, 'meta.json'))) {
    throw new Error('No index yet. Run: npm run ask:index');
  }
  // Say what is happening at every step: a cold first answer loads a 2 GB
  // model, and a blank cursor for a minute read as "didn't work at all".
  const step = (msg) => process.stderr.write(`${msg}\n`);
  const meta = JSON.parse(fs.readFileSync(path.join(OUT, 'meta.json'), 'utf8'));
  step(`Searching ${meta.chunks.length.toLocaleString()} passages of the project...`);
  const vectors = new Float32Array(fs.readFileSync(path.join(OUT, 'vectors.bin')).buffer.slice(0));

  const er = await fetch(`${HOST}/api/embed`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: meta.embedModel, input: [question] }),
  }).catch(() => { throw new Error(`Ollama is not running at ${HOST}. Start the Ollama app.`); });
  if (!er.ok) throw new Error(`Ollama /api/embed answered ${er.status}: ${(await er.text()).slice(0, 200)}`);
  const q = (await er.json()).embeddings[0];

  const hits = topK(q, vectors, meta.dim, K).map(([i, score]) => ({ ...meta.chunks[i], score }));
  const list = hits.map((h, i) => `  [${i + 1}] ${h.file}:${h.line}${h.heading ? '  (' + h.heading + ')' : ''}`).join('\n');

  if (sourcesOnly) {
    console.log(`Closest passages:\n${list}`);
    return;
  }

  step(`Found: ${[...new Set(hits.map((h) => h.file))].slice(0, 4).join(', ')}${hits.length > 4 ? ', ...' : ''}`);
  // Is the answer model already in memory? If not, loading it is the slow part.
  let loaded = false;
  try {
    const ps = await (await fetch(`${HOST}/api/ps`)).json();
    loaded = (ps.models || []).some((m) => m.name === MODEL || m.model === MODEL);
  } catch { /* the chat call below reports a real problem */ }
  step(loaded
    ? `Asking ${MODEL}...`
    : `Loading ${MODEL} into memory (the first question after a while can take a minute or more)...`);

  const { system, user } = buildPrompt(question, hits);
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, stream: true, options: { temperature: 0.1 }, messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ] }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (/not found/i.test(body)) throw new Error(`Ollama has no model "${MODEL}". Run: ollama pull ${MODEL}`);
    throw new Error(`Ollama /api/chat answered ${res.status}: ${body.slice(0, 200)}`);
  }
  // Streamed: the answer prints as it is written.
  const decoder = new TextDecoder();
  let pending = '';
  for await (const part of res.body) {
    pending += decoder.decode(part, { stream: true });
    let nl;
    while ((nl = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, nl).trim();
      pending = pending.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.message?.content) process.stdout.write(msg.message.content);
    }
  }
  console.log(`\n\nSources:\n${list}`);
}

main().catch((e) => { console.error(`[ask] ${e.message}`); process.exit(1); });
