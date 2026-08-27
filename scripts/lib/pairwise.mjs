/**
 * All-pairs (pairwise) combination generation.
 *
 * John: "but our permutation formula should have taken care of that?"
 *
 * It should have, and there was no formula. permutation-compliance built
 * `{ [propName]: value }` -- ONE attribute at a time -- so no two attributes
 * were ever set together. That is why `<table headers rows>` was never tried:
 * `headers` alone renders nothing and `rows` alone renders nothing, so both
 * scored as "attribute does nothing" while the documented pair worked fine.
 *
 * WHY PAIRWISE AND NOT EVERY COMBINATION
 *
 * Exhaustive is not reachable. table declares 15 attributes; even at two
 * values each that is 32,768 renders for one behavior, and several behaviors
 * declare enums of 6+. Pairwise guarantees that every PAIR of attribute-values
 * appears together in at least one case, which is the interaction depth real
 * bugs live at -- one option quietly cancelling another, or needing another to
 * do anything at all. It does that in tens of cases rather than tens of
 * thousands.
 *
 * Greedy IPOG-style: start from the pairs that must be covered, and keep
 * emitting the case that covers the most still-uncovered pairs.
 */

/**
 * @param {Array<{name: string, values: any[]}>} params
 * @param {object} [opts]
 * @param {number} [opts.max] hard ceiling on emitted cases
 * @param {Record<string, string[]>} [opts.dependentRequired]
 *        JSON Schema's own keyword: if `a` is set, the names it lists must be
 *        set too. Without this a pair like headers+rows can be generated with
 *        only one of the two present, which tests nothing.
 * @returns {{cases: Array<Record<string, any>>, coveredPairs: number, totalPairs: number, truncated: boolean}}
 */
export function pairwiseCases(params, { max = 60, dependentRequired = {} } = {}) {
  const usable = params.filter((p) => Array.isArray(p.values) && p.values.length > 0);
  if (usable.length === 0) return { cases: [], coveredPairs: 0, totalPairs: 0, truncated: false };
  if (usable.length === 1) {
    return {
      cases: usable[0].values.map((v) => ({ [usable[0].name]: v })),
      coveredPairs: 0,
      totalPairs: 0,
      truncated: false,
    };
  }

  // Every pair of (paramA=valueA, paramB=valueB) that should appear together.
  //
  // The key CANONICALISES its own operand order. The first version built keys
  // in parameter-array order but looked them up in alphabetical order, so any
  // pair whose two names disagreed between those orders could never be marked
  // covered: the generator emitted case after case that recorded nothing, ran
  // to the cap, and reported "12/34 pairs covered" for a set it had in fact
  // already exercised. Sorting inside the key makes the two impossible to
  // diverge, rather than relying on every call site to sort identically.
  const pairKey = (an, av, bn, bv) => {
    const a = { n: an, v: av };
    const b = { n: bn, v: bv };
    const [x, y] = a.n <= b.n ? [a, b] : [b, a];
    return `${x.n}=${JSON.stringify(x.v)}|${y.n}=${JSON.stringify(y.v)}`;
  };
  const remaining = new Set();
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      for (const av of usable[i].values) {
        for (const bv of usable[j].values) {
          remaining.add(pairKey(usable[i].name, av, usable[j].name, bv));
        }
      }
    }
  }
  const totalPairs = remaining.size;

  /** Add whatever `name` depends on, so a generated case is actually valid. */
  const withDependencies = (candidate) => {
    const out = { ...candidate };
    let changed = true;
    while (changed) {
      changed = false;
      for (const name of Object.keys(out)) {
        for (const dep of dependentRequired[name] || []) {
          if (out[dep] !== undefined) continue;
          const p = usable.find((x) => x.name === dep);
          if (!p) continue;
          out[dep] = p.values[0];
          changed = true;
        }
      }
    }
    return out;
  };

  const newPairsCovered = (testCase) => {
    const names = Object.keys(testCase);
    let n = 0;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const [a, b] = [names[i], names[j]].sort();
        if (remaining.has(pairKey(a, testCase[a], b, testCase[b]))) n++;
      }
    }
    return n;
  };

  const markCovered = (testCase) => {
    const names = Object.keys(testCase);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const [a, b] = [names[i], names[j]].sort();
        remaining.delete(pairKey(a, testCase[a], b, testCase[b]));
      }
    }
  };

  const cases = [];
  let truncated = false;

  while (remaining.size > 0) {
    if (cases.length >= max) {
      truncated = true;
      break;
    }

    // Seed from a still-uncovered pair so progress is guaranteed, then fill the
    // remaining parameters with whichever value adds the most coverage.
    const seed = remaining.values().next().value;
    const [left, right] = seed.split('|');
    // Keys are canonicalised (sorted by name), so left/right are simply the
    // two halves -- no assumption about which parameter came first.

    const parse = (s) => {
      const idx = s.indexOf('=');
      return { name: s.slice(0, idx), value: JSON.parse(s.slice(idx + 1)) };
    };
    const a = parse(left);
    const b = parse(right);

    let testCase = { [a.name]: a.value, [b.name]: b.value };

    for (const p of usable) {
      if (testCase[p.name] !== undefined) continue;
      let best = p.values[0];
      let bestScore = -1;
      for (const v of p.values) {
        const score = newPairsCovered({ ...testCase, [p.name]: v });
        if (score > bestScore) {
          bestScore = score;
          best = v;
        }
      }
      testCase[p.name] = best;
    }

    testCase = withDependencies(testCase);
    markCovered(testCase);
    cases.push(testCase);
  }

  return { cases, coveredPairs: totalPairs - remaining.size, totalPairs, truncated };
}
