/**
 * ═══════════════════════════════════════════════════════════════════════════
 * A demo label must not promise an action the demo cannot perform (#758)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, on the button example: "Don't use misleading text. this button doesn't
 * download anything. It only shows how to show a button with a warning."
 *
 *   <button variant="warning" icon="download" size="md">Download report</button>
 *
 * It is a styling demo. It downloads nothing and cannot. A reader who clicks
 * it learns only that the example lied.
 *
 * The rule already holds elsewhere — "Button example of a centered x-dialog",
 * "Details sample of Trail conditions" — and was simply never applied to
 * buttons demonstrating the BUTTON behavior itself, the one case where the
 * label is pure sample copy.
 *
 * An action verb is the specific trap: it reads as a working control.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

/**
 * Verbs that read as a live control. Deliberately only the leading word: a
 * label like "Downloads happen on submit" is describing, not promising, and
 * flagging it would push authors toward vaguer copy rather than honest copy.
 */
const ACTION_VERB = new RegExp(
  '^(download|send|submit|upload|save|delete|remove|buy|pay|checkout|' +
  'sign\\s?in|sign\\s?up|log\\s?in|log\\s?out|install|export|import|print|' +
  'share|publish|deploy|subscribe|order|confirm\\s+purchase)\\b',
  'i'
);

/** Interactive labels in a chunk of example markup. */
function labelsIn(html: string): { tag: string; text: string }[] {
  const out: { tag: string; text: string }[] = [];
  for (const m of html.matchAll(/<(button|a)\b([^>]*)>\s*([^<>]{2,80}?)\s*<\/\1>/gs)) {
    out.push({ tag: m[1], text: m[3].replace(/\s+/g, ' ').trim() });
  }
  return out;
}

test('no example label starts with an action verb it cannot perform', () => {
  const file = join(root, 'data/behavior-examples.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));

  const offenders: string[] = [];
  const walk = (node: any, key: string) => {
    if (Array.isArray(node)) node.forEach((v) => walk(v, key));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, k);
    } else if (typeof node === 'string' && node.includes('<')) {
      for (const { tag, text } of labelsIn(node)) {
        if (ACTION_VERB.test(text)) {
          offenders.push(`${key}: <${tag}>${text}</${tag}> — promises an action the demo does not perform`);
        }
      }
    }
  };
  walk(data, '$');

  expect(
    offenders,
    'A demo label must say what the example demonstrates, not name an action it cannot carry out:\n  ' +
      offenders.join('\n  ')
  ).toEqual([]);
});

test('the verb list is live — the rule cannot pass by matching nothing', () => {
  // A rule whose pattern silently stopped matching would pass forever.
  expect(ACTION_VERB.test('Download report')).toBe(true);
  expect(ACTION_VERB.test('Send')).toBe(true);
  expect(ACTION_VERB.test('Button example of a primary button')).toBe(false);
  expect(ACTION_VERB.test('Details sample of Trail conditions')).toBe(false);
});
