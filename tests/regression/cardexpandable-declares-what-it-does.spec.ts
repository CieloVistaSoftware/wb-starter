import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * x-cardexpandable's schema, and the doc generated from it, declare exactly
 * the event, API and CSS variables the code provides (#1600).
 *
 * They declared `wb:expandable:toggle`, expand()/collapse()/isExpanded() and
 * five CSS variables. card.js fires `wb:cardexpandable:toggle` and exposes
 * element.wbCardExpandable.show()/hide()/toggle()/expanded, and card.css read
 * one of the five. An author following the doc got a listener that never ran.
 *
 * Read from the schema, so a declaration added later is held to the same rule.
 */
const ROOT = process.cwd();
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/wb-models/cardexpandable.schema.json'), 'utf8'));
// Every stylesheet x-cardexpandable loads: the card base and, since #966, its
// own cardexpandable.css, where its rules now live.
const cardCss = ['card.css', 'cardexpandable.css']
  .map((f) => fs.readFileSync(path.join(ROOT, 'src/styles/behaviors', f), 'utf8'))
  .join('\n');

const EVENTS = Object.keys(schema.events || {});
const METHODS = Object.keys(schema.$methods || {});
const CSS_VARS = Object.keys(schema.$cssAPI || {});

test('the schema declares an event, methods and CSS variables, so the checks below can fail', () => {
  expect(EVENTS.length).toBeGreaterThan(0);
  expect(METHODS.length).toBeGreaterThan(0);
  expect(CSS_VARS.length).toBeGreaterThan(0);
});

test('every declared CSS variable is read by its stylesheets, and they read no undeclared one', () => {
  const unread = CSS_VARS.filter((name) => !cardCss.includes(`var(${name}`));
  expect(unread, 'declared in $cssAPI, read by no rule').toEqual([]);
  const read = [...new Set(cardCss.match(/var\(--x-card-expandable-[a-z-]+/g) || [])].map((v) => v.slice(4));
  expect(read.filter((name) => !CSS_VARS.includes(name)), 'read by card.css/cardexpandable.css, missing from $cssAPI').toEqual([]);
});

test('the declared event fires, and the declared methods drive the card', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });

  const result = await page.evaluate(async ({ events, methods }) => {
    const host = document.createElement('div');
    host.style.cssText = 'width:320px';
    host.innerHTML = `<article x-cardexpandable title="Details" lines="2">${'A long line of text. '.repeat(40)}</article>`;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    const card = host.firstElementChild as any;

    const heard: string[] = [];
    for (const name of events) document.addEventListener(name, () => heard.push(name));

    const api = card.wbCardExpandable || {};
    const missing = methods.filter((m: string) => typeof api[m] !== 'function');
    const states: boolean[] = [api.expanded];
    api.show?.(); states.push(api.expanded);
    api.hide?.(); states.push(api.expanded);
    api.toggle?.(); states.push(api.expanded);
    host.remove();
    return { heard, missing, states };
  }, { events: EVENTS, methods: METHODS });

  expect(result.missing, 'declared in $methods, absent from element.wbCardExpandable').toEqual([]);
  expect(result.states, 'collapsed, show, hide, toggle').toEqual([false, true, false, true]);
  expect([...new Set(result.heard)].sort(), 'each declared event fires').toEqual([...EVENTS].sort());
});
