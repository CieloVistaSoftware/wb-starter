/**
 * The version a release is about to cut -- one rule for ship.mjs, release.mjs
 * and release-entry.mjs, so the number, its Releases entry and its tag cannot
 * disagree.
 *
 *   (no flag)        next patch       4.0.6 -> 4.0.7
 *   --minor          next minor       4.0.6 -> 4.1.0
 *   --as X.Y.Z       exactly X.Y.Z    4.0.6 -> 1.0.0
 *
 * --as exists for 1.0 (John, 2026-09-29: "i want this to be 1.0 the first
 * public release"): a deliberate number, even one lower than the last pre-1.0
 * build. It must be a plain X.Y.Z and must differ from the current version.
 */
export function nextVersion(current, argv = process.argv) {
  const at = argv.indexOf('--as');
  const inline = argv.find((a) => a.startsWith('--as='));
  const explicit = inline ? inline.slice(5) : at !== -1 ? argv[at + 1] : null;
  if (explicit != null) {
    if (!/^\d+\.\d+\.\d+$/.test(explicit)) throw new Error(`--as needs a plain X.Y.Z version, got "${explicit}"`);
    if (explicit === current) throw new Error(`--as ${explicit} is already the current version`);
    return explicit;
  }
  const [maj, min, patch] = current.split('.').map(Number);
  return argv.includes('--minor') ? `${maj}.${min + 1}.0` : `${maj}.${min}.${patch + 1}`;
}

/** The version flags to pass on to a child script, as given. */
export function versionFlags(argv = process.argv) {
  const out = [];
  const at = argv.indexOf('--as');
  const inline = argv.find((a) => a.startsWith('--as='));
  if (inline) out.push(inline);
  else if (at !== -1 && argv[at + 1]) out.push('--as', argv[at + 1]);
  else if (argv.includes('--minor')) out.push('--minor');
  return out.join(' ');
}
