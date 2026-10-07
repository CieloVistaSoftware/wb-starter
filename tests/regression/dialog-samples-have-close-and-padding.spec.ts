/**
 * EVERY DIALOG SAMPLE OPENS WITH A VISIBLE WAY OUT, AND MEETS SECTION 13
 * ======================================================================
 * #1005 - John: "all dialog samples must have a close button showing", and
 * then, of the same samples: "when the dialogs open they must meet all our
 * layout specs."
 *
 * There were two families of dialog sample and only one worked:
 *
 *   x-dialog...  (attribute on a trigger)  -> header/main/footer, close present
 *   dialog...    (an authored <dialog>)    -> the raw <h2> and <p>, nothing else
 *
 * dialog.js's <dialog> branch added two classes and stopped - "we just want to
 * style the existing one". So the authored samples opened as traps (Escape and
 * the backdrop are not visible affordances), and because `.x-dialog` is
 * deliberately `padding: 0` - the padding lives on `.x-dialog__main`, which did
 * not exist - their text sat 0px from the frame, against the >=1rem minimum in
 * DEMOS-AND-DOCS-STANDARDS.md section 13. Adding a class without the structure
 * that class assumes produced both symptoms at once.
 *
 * THIS TEST WALKS EVERY DIALOG SAMPLE, NOT A REPRESENTATIVE ONE. A single
 * passing `x-dialog` sample is exactly what kept 11 broken rows invisible.
 */

import { test, expect } from '../fixtures/offline';

const MIN_PAD_PX = 15; // 1rem at a 16px root, with rounding slack

async function openBehaviors(page: any) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    undefined,
    { timeout: 30_000 }
  );
  // Rows existing is not the page being wired. In the 1.0 release gate (the
  // full suite, 30 minutes of load) every one of the 22 samples reported
  // "nothing rendered in the stage": the clicks landed before the page could
  // answer them. The page preselects a row once it is live (#771) and
  // highlights that row's source only after the stage scan resolves, so a
  // highlighted <code> in the live-code panel is the page saying it is ready.
  await page.waitForFunction(
    () => !!document.querySelector('#behaviors-live-code pre code.hljs'),
    undefined,
    { timeout: 30_000 }
  );
}

/**
 * Click the first row of the dialog group and wait until its <dialog> is in the
 * stage AND dialog.js has run on it (x-ready). #1515: this was a 600ms sleep
 * for the group and a 1500ms one for the sample; on a loaded runner the sample
 * was read half-enhanced -- no header yet, so "the heading was not moved" and
 * "the dialog never opened" -- on a PR that touched nothing dialog-related.
 */
async function showFirstDialogSample(page: any) {
  const clicked = await page.evaluate(() => {
    const g = [...document.querySelectorAll('details')].find((d) =>
      /dialog/i.test((d.querySelector('summary') || {}).textContent || '')
    ) as HTMLDetailsElement | undefined;
    const row = g?.querySelector('.behaviors-search-results__row') as HTMLElement | null;
    if (!g || !row) return false;
    g.open = true;
    (window as any).__dialogBefore = document.querySelector('.behaviors-live__stage dialog');
    row.click();
    return true;
  });
  expect(clicked, 'the behaviors page has no dialog group with a row to click').toBe(true);
  await page.waitForFunction(() => {
    const dlg = document.querySelector('.behaviors-live__stage dialog');
    return !!dlg && dlg !== (window as any).__dialogBefore && dlg.hasAttribute('x-ready');
  }, undefined, { timeout: 15_000 }).catch(async () => {
    const state = await page.evaluate(() => {
      const dlg = document.querySelector('.behaviors-live__stage dialog');
      return dlg ? `a <dialog> is in the stage, x-ready=${dlg.hasAttribute('x-ready')}` : 'no <dialog> in the stage';
    });
    throw new Error(`the first dialog sample never finished building: ${state}`);
  });
}

test.describe('dialog samples: visible close, section 13 spacing (#1005)', () => {
  test('every dialog sample has a visible close control and a padded body', async ({ page }) => {
    // A sweep needs a sweep's budget. This walks EVERY dialog sample — 11 rows —
    // and the default 30s cannot hold that: the per-row wait alone was 11 x 1.4s
    // before the page had even loaded. Measured: it timed out twice in a row on
    // an idle machine, reporting nothing about dialogs at all, which is worse
    // than a slow test. The per-row wait below is now a poll that returns as
    // soon as the sample is up instead of always spending its full slice.
    test.setTimeout(120_000);
    await openBehaviors(page);

    const findings = await page.evaluate(async (minPad: number) => {
      const groups = [...document.querySelectorAll('details')].filter((d) =>
        /dialog/i.test((d.querySelector('summary') || {}).textContent || '')
      ) as HTMLDetailsElement[];
      // The rows are already in the DOM (openBehaviors waited for them); opening
      // the group only shows them. #1515: a 700ms sleep followed, for nothing.
      for (const g of groups) g.open = true;

      const rows = groups.flatMap((g) => [...g.querySelectorAll('.behaviors-search-results__row')]);
      const out: any[] = [];


      // TWO SHAPES OF SAMPLE, and the difference is the whole reason this test
      // reported nonsense:
      //
      //   <dialog …>            the semantic form — the element IS in the stage,
      //                         closed, and a trigger beside it opens it.
      //   <button x-dialog …>   the attribute form — the stage holds only a
      //                         TRIGGER (.x-dialog-trigger). Measured live:
      //                         document.querySelectorAll('dialog').length is 0
      //                         until that trigger is clicked, and the dialog is
      //                         then created outside the stage.
      //
      // Looking only inside the stage found nothing for all 11 x-dialog rows and
      // called them unrendered. The sample is fine; the search was too narrow.
      const stageDialog = () =>
        document.querySelector('.behaviors-live__stage dialog') as HTMLDialogElement | null;
      const anyOpenDialog = () =>
        document.querySelector('dialog[open]') as HTMLDialogElement | null;
      const stageTrigger = () =>
        document.querySelector(
          '.behaviors-live__stage .x-dialog-trigger, .behaviors-live__stage button:not(.x-dialog__close)'
        ) as HTMLElement | null;

      // The thing to wait on is THIS ROW'S SAMPLE, whichever shape it takes —
      // the <dialog> for the semantic form, the trigger for the attribute form.
      // Waiting specifically for a stage <dialog> marked every attribute-form
      // row "never signalled x-ready" while its trigger was sitting right there,
      // ready, and opening correctly.
      const stageSample = () =>
        document.querySelector(
          '.behaviors-live__stage dialog, .behaviors-live__stage .x-dialog-trigger'
        ) as HTMLElement | null;

      for (const row of rows) {
        const label = (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const previous = stageSample();
        (row as HTMLElement).click();
        // Poll for THIS row's sample instead of spending a flat 1.4s on every
        // row. Same ceiling, but a sample that renders in 200ms costs 200ms.
        // The identity check matters: the previous row's dialog is still in the
        // stage for a moment, so "a dialog exists" would pass instantly and
        // measure the wrong element.
        let ready = false;
        for (let i = 0; i < 28; i++) {
          const now = stageSample();
          // x-ready is the page's own signal that the behavior has RUN on this
          // element. Breaking on "a new <dialog> exists" is too early: the
          // element is in the stage before dialog.js has built its header, so
          // the close button legitimately is not there yet and every sample
          // reports hasClose=false — measured, 10 of 11, with the markup
          // present and correct a moment later.
          if (now && now !== previous && now.hasAttribute('x-ready')) { ready = true; break; }
          await new Promise((r) => requestAnimationFrame(r));
        }

        const notes: string[] = [];
        if (!ready) notes.push('the sample never signalled x-ready');

        // showClose="false" is the ONE sample whose whole point is that the
        // close button is gone -- it is the option being demonstrated. Read it
        // off the sample's own markup (not the row label), so only a sample
        // that really carries the option is exempt, and so the exemption is
        // itself checked below: that sample must render NO close button. The
        // behaviors page used to write this option as camelCase (showClose),
        // which dialog.js never read, so the row silently showed a close button
        // and passed this test while demonstrating nothing. It now writes the
        // schema name, showClose, again (#1526) -- which dialog.js reads since
        // #747/#1125. getAttribute lower-cases its argument on an HTML element,
        // so 'showClose' finds the `showclose` the parser stored.
        const sampleEl = stageSample();
        const closeOptedOut = !!sampleEl && sampleEl.getAttribute('showClose') === 'false';

        // The attribute form builds its dialog on demand, so the trigger has to
        // be pressed before there is anything to measure.
        let dlg = stageDialog();
        if (!dlg) {
          const trigger = stageTrigger();
          if (!trigger) {
            out.push({ label, rendered: false, notes: notes.concat('no dialog and no trigger in the stage') });
            continue;
          }
          trigger.click();
          for (const end = performance.now() + 1200; !anyOpenDialog() && performance.now() < end;) await new Promise((r) => requestAnimationFrame(r));
          dlg = anyOpenDialog();
          if (!dlg) {
            out.push({ label, rendered: false, notes: notes.concat('the trigger opened no dialog anywhere on the page') });
            continue;
          }
        }

        // OPEN IT. A <dialog> that is not open is display:none, so every child
        // measures 0x0 — the close button is right there in the markup and this
        // test called it invisible for all 11 samples. The sample renders a
        // TRIGGER; the dialog is what the trigger opens, and "the close control
        // is visible" is a claim about the open state.
        //
        // NOTHING HERE DIES IN SILENCE. Every way this can go wrong is recorded
        // on the row and reported by name below: no trigger to click, the
        // trigger not opening it, showModal() throwing, the behavior never
        // signalling ready. A swallowed failure here would surface later as
        // "the close button is invisible", which is a lie about a different
        // element.
        if (!dlg.open) {
          const trigger = stageTrigger();
          if (!trigger) {
            notes.push('no trigger button rendered in the stage');
          } else {
            trigger.click();
            for (const end = performance.now() + 1000; !dlg.open && performance.now() < end;) await new Promise((r) => requestAnimationFrame(r));
            if (!dlg.open) notes.push('the trigger did not open the dialog');
          }
          // showModal() as the fallback, not the primary: going through the
          // trigger is what a reader does, and a sample whose trigger does not
          // open its dialog is a defect this test should still catch — hence
          // the note above, recorded even when the fallback then succeeds.
          if (!dlg.open && typeof dlg.showModal === 'function') {
            try {
              dlg.showModal();
            } catch (err) {
              notes.push('showModal() threw: ' + ((err as Error) || {}).message);
            }
          }
          if (!dlg.open) notes.push('the dialog never opened, so nothing below was measurable');
        }

        const close = dlg.querySelector('.x-dialog__close') as HTMLElement | null;
        let closeVisible = false;
        if (close) {
          const cs = getComputedStyle(close);
          const r = close.getBoundingClientRect();
          closeVisible =
            cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        }

        const body = dlg.querySelector('.x-dialog__main') as HTMLElement | null;
        let padOk = false;
        let pad = 'none';
        if (body) {
          const cs = getComputedStyle(body);
          const p = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(
            (v) => parseFloat(v) || 0
          );
          pad = p.join('/');
          padOk = p.every((v) => v >= minPad);
        }

        // Leave the stage closed for the next row: a modal left open holds the
        // top layer and swallows the next row's click — which would report the
        // NEXT sample as broken. If closing fails, say so on this row rather
        // than letting the next one take the blame.
        if (dlg.open && typeof dlg.close === 'function') {
          try {
            dlg.close();
          } catch (err) {
            notes.push('close() threw, so the next sample was measured under an open modal: '
              + ((err as Error) || {}).message);
          }
          // close() is synchronous: dlg.open is false the moment it returns.
          if (dlg.open) notes.push('close() returned with the dialog still open');
        }

        out.push({ label, rendered: true, closeOptedOut, hasClose: !!close, closeVisible, hasBody: !!body, pad, padOk, notes });
      }
      return out;
    }, MIN_PAD_PX);

    expect(findings.length, 'no dialog samples were found to check').toBeGreaterThan(5);

    // Reported FIRST and separately: anything that stopped this test from
    // measuring what it came to measure. Folding these into the close-button
    // assertion below blames the close button for a sample that never opened,
    // which is how a test sends you looking in the wrong file.
    const unmeasurable = findings.filter((f: any) => !f.rendered || (f.notes || []).length);
    expect(
      unmeasurable.map((f: any) => f.label),
      'these dialog samples could not be measured — the reason is per sample, and none of '
      + 'them is a statement about the close button:\n'
      + unmeasurable
        .map((f: any) => `  ${f.label}: ${f.rendered ? (f.notes || []).join('; ') : 'nothing rendered in the stage'}`)
        .join('\n')
    ).toEqual([]);

    // The showClose="false" sample must exist (otherwise the exemption below
    // is exempting nothing and could hide a regression) and must honour it.
    // One per authoring form: the <dialog> group and the x-dialog group each
    // list a showClose=false row. It used to be one, because the semantic
    // row's option was written onto the example's TRIGGER <button> instead of
    // its <dialog> (#773) -- so that row demonstrated nothing, and was not
    // counted here.
    const optedOut = findings.filter((f: any) => f.rendered && f.closeOptedOut);
    expect(
      optedOut.length,
      'expected one dialog sample per authoring form demonstrating showClose="false"',
    ).toBe(2);
    expect(
      optedOut.filter((f: any) => f.closeVisible).map((f: any) => f.label),
      'showClose="false" was ignored -- these samples still show a close button',
    ).toEqual([]);

    const noClose = findings.filter((f: any) => f.rendered && !f.closeOptedOut && !f.closeVisible);
    expect(
      noClose.map((f: any) => f.label),
      'these dialog samples open with no visible close button:\n' +
        noClose.map((f: any) => `  ${f.label} (hasClose=${f.hasClose})`).join('\n')
    ).toEqual([]);

    const cramped = findings.filter((f: any) => f.rendered && !f.padOk);
    expect(
      cramped.map((f: any) => f.label),
      'these dialogs put text under 1rem from their own edge (section 13):\n' +
        cramped.map((f: any) => `  ${f.label} padding=${f.pad}`).join('\n')
    ).toEqual([]);
  });

  test('the close button actually closes the dialog', async ({ page }) => {
    // A close glyph that is present but inert would satisfy every assertion above.
    await openBehaviors(page);
    await showFirstDialogSample(page);

    await page.evaluate(() => {
      const dlg = document.querySelector('.behaviors-live__stage dialog') as HTMLDialogElement;
      if (!dlg.open) dlg.showModal();
    });
    // #1515: waits on dialog.open itself, not 300ms / 400ms of clock.
    await page.waitForFunction(
      () => (document.querySelector('.behaviors-live__stage dialog') as HTMLDialogElement).open,
      undefined,
      { timeout: 5000 },
    ).catch(() => { throw new Error('the dialog never opened, so closing proves nothing'); });

    const hasClose = await page.evaluate(() => {
      const btn = document.querySelector('.behaviors-live__stage dialog .x-dialog__close') as HTMLElement | null;
      if (btn) btn.click();
      return !!btn;
    });
    expect(hasClose, 'the opened dialog has no .x-dialog__close to click').toBe(true);
    await page.waitForFunction(
      () => !(document.querySelector('.behaviors-live__stage dialog') as HTMLDialogElement).open,
      undefined,
      { timeout: 5000 },
    ).catch(() => { throw new Error('clicking the close button left the dialog open'); });
  });

  test('authored content survives the enhancement', async ({ page }) => {
    // The header and body are built by MOVING the authored nodes. If that ever
    // becomes a clone or a re-render, ids and handlers go missing - the failure
    // mode that made the fieldset toggle dead in #999.
    await openBehaviors(page);
    await showFirstDialogSample(page);

    const kept = await page.evaluate(() => {
      const dlg = document.querySelector('.behaviors-live__stage dialog')!;
      const heading = dlg.querySelector(
        '.x-dialog__header h1, .x-dialog__header h2, .x-dialog__header h3'
      );
      const body = dlg.querySelector('.x-dialog__main');
      return {
        headingInHeader: !!heading,
        headingText: heading ? (heading.textContent || '').trim() : null,
        labelledBy: dlg.getAttribute('aria-labelledby'),
        bodyText: (body ? body.textContent || '' : '').trim().slice(0, 60),
      };
    });

    expect(kept!.headingInHeader, 'the authored heading was not moved into the dialog header').toBe(true);
    expect(kept!.headingText, 'the authored heading lost its text').toBeTruthy();
    expect(kept!.bodyText.length, 'the authored body content did not survive').toBeGreaterThan(0);
    expect(kept!.labelledBy, 'aria-labelledby was not pointed at the heading').toBeTruthy();
  });
});
