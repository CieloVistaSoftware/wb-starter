import { test, expect } from '../fixtures/offline';
// @ts-ignore -- an .mjs module with no type declarations
import { isKnowledge, chunkFile, embedText, cosine, topK, buildPrompt, tokenize, queryTerms, bm25, fuse } from '../../scripts/lib/ask-core.mjs';

/**
 * `npm run ask` (#1926): the parts that decide what the local model sees.
 *
 * John, 2026-10-16: "what i want is an llm that serves known data such as
 * anything from our WB-Starter project". The model is small and runs on this
 * laptop; the knowledge is the project's files, found by search. So these
 * must hold, and none of them needs Ollama:
 *   - every line of a file reaches some passage, in order, labelled with its
 *     path and nearest heading (a lost line is knowledge the model never sees);
 *   - ranking puts the closest passage first;
 *   - the prompt confines the model to its sources and tells it to say when
 *     they do not answer, instead of guessing.
 */
test('project knowledge: docs, code and schemas in; archive and generated data out', () => {
  expect(isKnowledge('docs/behaviors/dialog.md')).toBe(true);
  expect(isKnowledge('src/wb-viewmodels/card.js')).toBe(true);
  expect(isKnowledge('src/wb-models/cardhero.schema.json')).toBe(true);
  expect(isKnowledge('data/behavior-examples.json')).toBe(true);
  expect(isKnowledge('data/search.json')).toBe(false);
  expect(isKnowledge('archive/compliance-results.txt')).toBe(false);
  expect(isKnowledge('images/logo.png')).toBe(false);
});

test('every line lands in one passage, in order, with its heading', () => {
  const md = ['# Title', 'intro', '## Usage', ...Array.from({ length: 80 }, (_, i) => `line ${i} ` + 'x'.repeat(40)), '## Attributes', 'last'].join('\n');
  const chunks = chunkFile('docs/behaviors/x.md', md, 600);
  expect(chunks.length).toBeGreaterThan(3);
  expect(chunks.map((c) => c.text).join('\n')).toBe(md);
  expect(chunks.every((c) => c.file === 'docs/behaviors/x.md')).toBe(true);
  expect(chunks[0].heading).toBe('Title');
  expect(chunks.find((c) => c.text.includes('line 70'))!.heading).toBe('Usage');
  expect(chunks.at(-1)!.heading).toBe('Attributes');
  expect(chunks.at(-1)!.line).toBe(md.split('\n').indexOf('## Attributes') + 1);
  expect(embedText(chunks[0])).toMatch(/^docs\/behaviors\/x\.md > Title\n/);
});

test('ranking returns the closest passages first', () => {
  const dim = 3;
  const vectors = Float32Array.from([1, 0, 0, 0, 1, 0, 0.9, 0.1, 0, 0, 0, 1]);
  const ranked = topK([1, 0, 0], vectors, dim, 2);
  expect(ranked.map(([i]) => i)).toEqual([0, 2]);
  expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
  expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
});

test('the prompt holds the model to its sources and to "not found"', () => {
  const { system, user } = buildPrompt('What does headingLevel change?', [
    { file: 'docs/behaviors/cardhero.md', heading: 'Attributes', line: 34, text: 'headingLevel changes the tag, not the look.' },
  ]);
  expect(system).toMatch(/ONLY the numbered sources/);
  expect(system).toMatch(/do not guess/);
  expect(user).toContain('[1] docs/behaviors/cardhero.md > Attributes (line 34)');
  expect(user).toContain('Question: What does headingLevel change?');
});

/**
 * #1938. John: "I find it odd that we read and parse files a lot in this
 * project but q can't figure it out." Search by meaning alone ranked
 * package.json first for this question; the code that answers it says
 * readFileSync and writeFileSync. Keyword search, with everyday words mapped
 * to the project's, has to put that code first.
 */
test('a plain-English file question finds the code that reads, parses and saves', () => {
  expect(tokenize('JSON.parse(readFileSync(p))')).toEqual(expect.arrayContaining(['readfilesync', 'read', 'file', 'sync', 'parse']));
  expect(queryTerms('how do I save a file')).toEqual(expect.arrayContaining(['save', 'file', 'write', 'writefilesync']));
  expect(queryTerms('how do I save a file')).not.toContain('how');

  const passages = [
    { file: 'package.json', heading: '', line: 1, text: '{ "name": "wb-starter", "type": "module", "main": "index.json", "files": ["data/*.json"] }' },
    { file: 'scripts/bump.mjs', heading: '', line: 12, text: [
      "const pkg = JSON.parse(readFileSync(p, 'utf8'));",
      'pkg.version = next;',
      'writeFileSync(p, JSON.stringify(pkg, null, 2));',
    ].join('\n') },
    { file: 'docs/behaviors/toast.md', heading: 'Usage', line: 40, text: 'Add x-toast to a button to show a message.' },
    { file: 'scripts/report.mjs', heading: '', line: 8, text: "const rows = readFileSync(input, 'utf8').split('\\n');" },
    { file: 'scripts/stamp.mjs', heading: '', line: 30, text: 'writeFileSync(out, html);' },
  ];
  const keyword = bm25(queryTerms('how do I read, parse, change and save a JSON file'), passages.map((c) => tokenize(embedText(c))));
  expect(keyword[1]).toBe(Math.max(...keyword));
  expect(keyword[1]).toBeGreaterThan(keyword[0]);
  expect(keyword[2]).toBe(0);

  // Meaning alone prefers package.json (as it did on the real index); fused, the code wins.
  const meaning = [0.62, 0.55, 0.20, 0.30, 0.30];
  expect(fuse(meaning, keyword, 3)[0][0]).toBe(1);
});
