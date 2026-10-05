/**
 * ═══════════════════════════════════════════════════════════════════════════
 * dialog: every boolean option, in every author state (#747)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is the issue the whole "false means true" class is named after. John,
 * on the x-dialog examples:
 *
 *   <button showclose="false" x-dialog title="Delete branch?" …>
 *
 *   showclose="false"   still rendered the close control.
 *
 * The usual cause is a bare `hasAttribute()`, true for ANY value including the
 * string "false". That is what #1140 (range) and #1344 (table) were. Here it
 * is not: #1005 already routed these three through `readFlag`. What was wrong
 * is the NAME each one was read under — `readFlag(element, 'show-close')`,
 * which looks up `show-close` and `data-show-close` and never `showClose`. So
 * the dashed spelling worked, the spelling the schema declares and
 * ATTRIBUTE-NAMING-STANDARD.md calls canonical (#1125) was invisible, and an
 * author writing `showClose="false"` — the form in the issue — got no
 * attribute read at all and therefore the default: ON.
 *
 * Two bugs with one symptom, which is why one test has to cover both: the
 * name AND the value. Asserting only that `showClose` present turns the
 * control on cannot see either.
 *
 * The cases here are GENERATED from dialog.schema.json rather than chosen: the
 * schema says which properties exist, which are booleans and what each
 * defaults to, and this file enumerates every author state of each one, as a
 * full cross product. Hand-picked cases are exactly how this survived four
 * fixes — nobody picks the case they have not thought of.
 *
 * Boolean author states, all four:
 *
 *   absent      the schema's own `default` (all three default true)
 *   bare        on       <dialog showClose>
 *   "true"      on       <dialog showClose="true">
 *   "false"     OFF      <dialog showClose="false">      ← the bug
 *
 * Every option is checked by the USER ACTION it governs, not by reading the
 * config back out of the page: Escape is pressed, the backdrop is clicked.
 * Nothing here waits on a sleep — the enhancement is waited on by its own
 * outcome (the header dialog.js builds), per case.
 */
import { test, expect, Page } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

const SCHEMA_PATH = 'src/wb-models/dialog.schema.json';
const DOC_PATH = 'docs/behaviors/dialog.md';

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const props: Record<string, any> = schema.properties || {};
const booleanProps = Object.keys(props).filter((p) => props[p]?.type === 'boolean');

/** The exact property list this file's generator is written for. */
const DECLARED = [
  'title',
  'content',
  'size',
  'closeOnBackdrop',
  'closeOnEscape',
  'showClose',
  'variant',
];

type BoolState = 'absent' | 'bare' | 'true' | 'false';
const BOOL_STATES: BoolState[] = ['absent', 'bare', 'true', 'false'];

/** What the behavior must conclude from each author state. */
function resolves(state: BoolState, dflt: boolean): boolean {
  if (state === 'absent') return dflt;
  return state !== 'false';
}

function attr(name: string, state: BoolState): string {
  if (state === 'absent') return '';
  if (state === 'bare') return ` ${name}`;
  return ` ${name}="${state}"`;
}

type Case = {
  id: string;
  markup: string;
  states: Record<string, BoolState>;
  expected: Record<string, boolean>;
};

/**
 * The full cross product of the schema's booleans × their four author states.
 *
 * Generated from the schema so that a boolean added there without a case here
 * is a failure, not a silent gap — and so the `absent` row expects the
 * schema's own declared default rather than a number typed into this file.
 */
function buildCases(): Case[] {
  const cases: Case[] = [];
  let n = 0;
  const walk = (i: number, states: Record<string, BoolState>) => {
    if (i === booleanProps.length) {
      const id = `case${n++}`;
      const expected: Record<string, boolean> = {};
      let markup = `<dialog id="${id}"`;
      for (const p of booleanProps) {
        markup += attr(p, states[p]);
        expected[p] = resolves(states[p], props[p].default === true);
      }
      markup += `><h2>Case ${id}</h2><p>body text</p></dialog>`;
      cases.push({ id, markup, states: { ...states }, expected });
      return;
    }
    for (const state of BOOL_STATES) {
      walk(i + 1, { ...states, [booleanProps[i]]: state });
    }
  };
  walk(0, {});
  return cases;
}

const cases = buildCases();

/** Put every case in the page and wait for dialog() to have enhanced them. */
async function render(page: Page, markup: string[]): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate((html: string) => {
    const host = document.createElement('div');
    host.id = 'dialog-area';
    host.innerHTML = html;
    document.body.appendChild(host);
  }, markup.join('\n'));
  await page.evaluate(async () => {
    const el = document.getElementById('dialog-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(el, { eager: true });
  });

  // Wait on the OUTCOME — the header dialog.js builds on every authored
  // <dialog> — never on a guessed sleep. The sibling spec
  // dialog-samples-have-close-and-padding.spec.ts waits on hard-coded
  // setTimeouts and flaps in CI for exactly that reason.
  await expect
    .poll(
      () => page.locator('#dialog-area dialog.x-dialog > header.x-dialog__header').count(),
      { timeout: 20000, message: 'dialog() never enhanced the generated cases' },
    )
    .toBe(markup.length);
}

const isOpen = (page: Page, id: string) =>
  page.evaluate((x) => !!(document.getElementById(x) as HTMLDialogElement).open, id);

const openIt = (page: Page, id: string) =>
  page.evaluate((x) => {
    const d = document.getElementById(x) as HTMLDialogElement;
    if (!d.open) d.showModal();
  }, id);

const shutIt = (page: Page, id: string) =>
  page.evaluate((x) => {
    const d = document.getElementById(x) as HTMLDialogElement;
    if (d.open) d.close();
  }, id);

test('#747 the schema declares exactly the properties this file permutes', () => {
  expect(
    Object.keys(props).sort(),
    'a property added to dialog.schema.json needs a case here; the permutation '
      + 'below is generated for exactly this list',
  ).toEqual([...DECLARED].sort());

  expect(booleanProps.sort(), 'three of the declared properties are booleans').toEqual([
    'closeOnBackdrop',
    'closeOnEscape',
    'showClose',
  ]);

  // Each boolean is checked by the user action it governs. A boolean with no
  // observable action would make its cases prove nothing.
  expect(
    cases.length,
    'three booleans x four author states, as a cross product; a schema change must move this number',
  ).toBe(64);
});

test('#747 no schema property name carries a dash', () => {
  const dashed = Object.keys(props).filter((k) => k.includes('-'));
  expect(
    dashed,
    'only the x- behavior prefix may carry a dash (#1125); these are attribute names',
  ).toEqual([]);
});

test('#747 the doc names every attribute as the schema declares it', () => {
  const doc = readFileSync(DOC_PATH, 'utf8');

  const missing = Object.keys(props).filter((p) => !doc.includes('| `' + p + '` |'));
  expect(
    missing,
    `${DOC_PATH} must name each attribute as dialog.schema.json declares it`,
  ).toEqual([]);

  // And none under a dashed one. `show-close` is the name the doc taught while
  // the schema said showClose, and the doc is what people copy from.
  const dashedRows = Object.keys(props)
    .map((p) => p.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()))
    .filter((kebab) => kebab.includes('-') && doc.includes('| `' + kebab + '` |'));
  expect(
    dashedRows,
    'a dashed attribute name in the doc teaches the forbidden spelling',
  ).toEqual([]);

  // #747 part 2: John had to ask what "backdrop" meant. Whichever name is
  // kept, the doc must define the term where the attribute is read.
  expect(
    /dimmed|dim(med)?\s|overlay|outside the dialog/i.test(doc),
    'closeOnBackdrop names what the browser paints; the doc has to say what '
      + 'the user does — an attribute a reader must look up is undefined here',
  ).toBe(true);
});

test('#747 every boolean option behaves as its markup says, in all four states', async ({ page }) => {
  test.setTimeout(240_000);

  await render(page, cases.map((c) => c.markup));

  const wrong: string[] = [];
  for (const c of cases) {
    // showClose is structural: read it off the enhanced header.
    const hasClose = await page.evaluate(
      (x) => !!document.querySelector(`#${x} > header.x-dialog__header > .x-dialog__close`),
      c.id,
    );
    if (hasClose !== c.expected.showClose) {
      wrong.push(
        `${c.id}: close button ${hasClose ? 'shown' : 'absent'}, expected `
          + `${c.expected.showClose ? 'shown' : 'absent'}\n    ${c.markup}`,
      );
    }

    // closeOnEscape: press the key.
    await openIt(page, c.id);
    await page.keyboard.press('Escape');
    const escapeClosed = !(await isOpen(page, c.id));
    if (escapeClosed !== c.expected.closeOnEscape) {
      wrong.push(
        `${c.id}: Escape ${escapeClosed ? 'closed' : 'did not close'} it, expected `
          + `${c.expected.closeOnEscape ? 'closed' : 'left open'}\n    ${c.markup}`,
      );
    }

    // closeOnBackdrop: click outside the dialog box. With a modal <dialog> the
    // top layer covers the viewport and the click's target is the <dialog>
    // itself, which is the backdrop click the behavior listens for.
    await openIt(page, c.id);
    await page.mouse.click(3, 3);
    const backdropClosed = !(await isOpen(page, c.id));
    if (backdropClosed !== c.expected.closeOnBackdrop) {
      wrong.push(
        `${c.id}: a backdrop click ${backdropClosed ? 'closed' : 'did not close'} it, `
          + `expected ${c.expected.closeOnBackdrop ? 'closed' : 'left open'}\n    ${c.markup}`,
      );
    }
    await shutIt(page, c.id);
  }

  expect(
    wrong,
    `${wrong.length} of ${cases.length * 3} option readings disagree with their markup:\n  `
      + wrong.join('\n  '),
  ).toEqual([]);
});

test('#747 showClose is honoured on a trigger too, in all four states', async ({ page }) => {
  test.setTimeout(120_000);

  // The issue's own markup: the option on the trigger, which builds its dialog
  // on click rather than being enhanced in place.
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'trigger-area';
    document.body.appendChild(host);
  });

  const wrong: string[] = [];
  for (const state of BOOL_STATES) {
    await page.evaluate((markup) => {
      const host = document.getElementById('trigger-area')!;
      host.innerHTML = markup;
    }, `<button id="trig" x-dialog title="Delete branch?" content="gone for good" size="md"${attr('showClose', state)}>Delete branch…</button>`);
    await page.evaluate(async () => {
      const el = document.getElementById('trigger-area');
      if ((window as any).WB?.scan) await (window as any).WB.scan(el, { eager: true });
    });
    await expect
      .poll(() => page.locator('#trig.x-dialog-trigger, #trig.x-modal-trigger').count(), {
        timeout: 20000,
        message: 'dialog() never made the button a trigger',
      })
      .toBe(1);

    await page.locator('#trig').click();
    await expect
      .poll(() => page.locator('dialog.x-dialog[open]').count(), {
        timeout: 20000,
        message: 'the trigger never opened a dialog',
      })
      .toBe(1);

    const hasClose = await page
      .locator('dialog.x-dialog[open] .x-dialog__close')
      .count()
      .then((n) => n > 0);
    const expected = resolves(state, props.showClose.default === true);
    if (hasClose !== expected) {
      wrong.push(
        `showClose ${state}: close button ${hasClose ? 'shown' : 'absent'}, expected `
          + `${expected ? 'shown' : 'absent'}`,
      );
    }

    // Close it the way a user would, so the next state starts clean.
    await page.locator('dialog.x-dialog[open] .x-dialog__cancel').click();
    await expect
      .poll(() => page.locator('dialog.x-dialog[open]').count(), { timeout: 20000 })
      .toBe(0);
  }

  expect(wrong, `the trigger path ignores showClose:\n  ${wrong.join('\n  ')}`).toEqual([]);
});

test('#747 the dashed spelling still works, so existing markup keeps running', async ({ page }) => {
  // The names the code reads under changed; the markup already written must
  // not break. readFlag reads the kebab form as a fallback precisely so this
  // conversion costs nobody a working page.
  await render(page, [
    '<dialog id="old1" show-close="false"><h2>Old 1</h2><p>b</p></dialog>',
    '<dialog id="old2" close-on-escape="false"><h2>Old 2</h2><p>b</p></dialog>',
    '<dialog id="old3" close-on-backdrop="false"><h2>Old 3</h2><p>b</p></dialog>',
  ]);

  expect(
    await page.locator('#old1 .x-dialog__close').count(),
    'show-close="false" no longer hides the close button',
  ).toBe(0);

  await openIt(page, 'old2');
  await page.keyboard.press('Escape');
  expect(await isOpen(page, 'old2'), 'close-on-escape="false" no longer blocks Escape').toBe(true);
  await shutIt(page, 'old2');

  await openIt(page, 'old3');
  await page.mouse.click(3, 3);
  expect(
    await isOpen(page, 'old3'),
    'close-on-backdrop="false" no longer blocks the backdrop click',
  ).toBe(true);
  await shutIt(page, 'old3');
});

test('#747 a trigger declared in camelCase is read as a trigger', async ({ page }) => {
  // modalTitle / modalContent decide whether the host becomes a visible
  // trigger. Only the dashed spelling was ever looked up, so the camelCase
  // form fell through the gate and the dialog opened with the default title.
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'camel-area';
    host.innerHTML =
      '<button id="camel" x-dialog modalTitle="Camel title" modalContent="camel body">Open</button>';
    document.body.appendChild(host);
  });
  await page.evaluate(async () => {
    const el = document.getElementById('camel-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(el, { eager: true });
  });
  await expect
    .poll(() => page.locator('#camel.x-dialog-trigger, #camel.x-modal-trigger').count(), {
      timeout: 20000,
      message: 'dialog() never made the button a trigger',
    })
    .toBe(1);

  await page.locator('#camel').click();
  await expect
    .poll(() => page.locator('dialog.x-dialog[open]').count(), { timeout: 20000 })
    .toBe(1);

  expect(
    await page.locator('dialog.x-dialog[open] .x-dialog__title').innerText(),
    'modalTitle was not read, so the dialog opened under the default title',
  ).toBe('Camel title');
  expect(
    await page.locator('dialog.x-dialog[open] .x-dialog__body').innerText(),
    'modalContent was not read, so the trigger label became the body',
  ).toContain('camel body');
});
