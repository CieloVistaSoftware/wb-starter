/**
 * duplicate-blocks.mjs -- find word-for-word repeated blocks of code (#883)
 *
 * John: "no duplicates of any code allowed." #883 measured 85 duplicate
 * clusters across src/ with an external auditor, and three PRs (#1278, #1281
 * and the runtime-shared module) have been removing them. Nothing in this repo
 * could measure the count, so nothing could stop it growing back.
 *
 * A block is WINDOW consecutive significant lines (trimmed; blank lines and
 * comment-only lines dropped) that appear, character for character, in two or
 * more places. Overlapping windows of one repeat are merged, so a 40-line copy
 * counts as one block, not 29. Pure functions: the compliance test reads the
 * files and compares the count against its ceiling.
 */

export const WINDOW = 6;

const COMMENT_ONLY = /^(\/\/|\/\*|\*\/?|\*\s)/;

/** The lines that carry code, trimmed, each with its 1-based line number. */
export function significantLines(source) {
  const out = [];
  source.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || COMMENT_ONLY.test(line)) return;
    // A line of only brackets or punctuation matches everywhere and says
    // nothing about whether two blocks are copies of each other.
    if (/^[\s{}()[\];,]*$/.test(line)) return;
    out.push({ line, n: i + 1 });
  });
  return out;
}

/**
 * Repeated blocks across `files` ({ path: source }). Each block is
 * { lines, places: [{ path, start, end }] }, one per distinct repeat.
 */
export function duplicateBlocks(files, window = WINDOW) {
  const seen = new Map();          // window text -> [{ path, index }]
  const linesOf = {};
  for (const [path, source] of Object.entries(files)) {
    const lines = significantLines(source);
    linesOf[path] = lines;
    for (let i = 0; i + window <= lines.length; i++) {
      const key = lines.slice(i, i + window).map((l) => l.line).join('\n');
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push({ path, index: i });
    }
  }

  // Each duplicated window, keyed by where it starts in every place it occurs.
  const dupStart = new Set();
  for (const places of seen.values()) {
    if (places.length < 2) continue;
    for (const p of places) dupStart.add(`${p.path}\u0000${p.index}`);
  }

  // Merge runs of consecutive duplicated windows into one block per run, and
  // name each block by its first place so its copies are not counted again.
  const blocks = [];
  const claimed = new Set();
  for (const places of seen.values()) {
    if (places.length < 2) continue;
    const first = places[0];
    const id = `${first.path}\u0000${first.index}`;
    if (claimed.has(id)) continue;
    // Only start a block where the run starts.
    if (dupStart.has(`${first.path}\u0000${first.index - 1}`)) continue;
    let end = first.index;
    while (dupStart.has(`${first.path}\u0000${end + 1}`)) { end++; claimed.add(`${first.path}\u0000${end}`); }
    claimed.add(id);
    const span = (p) => {
      const lines = linesOf[p.path];
      const last = Math.min(p.index + (end - first.index) + window - 1, lines.length - 1);
      return { path: p.path, start: lines[p.index].n, end: lines[last].n };
    };
    blocks.push({ lines: end - first.index + window, places: places.map(span) });
  }
  return blocks;
}
