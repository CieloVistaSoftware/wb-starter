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
 * deliberately `padding: 0` - the padding lives on `.x-dialog__body`, which did
 * not exist - their text sat 0px from the frame, against the >=1rem minimum in
 * DEMOS-AND-DOCS-STANDARDS.md section 13. Adding a class without the structure
 * that class assumes produced both symptoms at once.
 *
 * THIS TEST WALKS EVERY DIALOG SAMPLE, NOT A REPRESENTATIVE ONE. A single
 * passing `x-dialog` sample is exactly what kept 11 broken rows invisible.
 */

import { test, expect } from '@playwright/test';

const MIN_PAD_PX = 15; // 1rem at a 16px root, with rounding slack

async function openBehaviors(page: any) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    undefined,
    { timeout: 30_000 }
  );
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
      for (const g of groups) g.open = true;
      await new Promise((r) => setTimeout(r, 700));

      const rows = groups.flatMap((g) => [...g.querySelectorAll('.behaviors-search-results__row')]);
      const out: any[] = [];

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
          await sleep(50);
        }

        const notes: string[] = [];
        if (!ready) notes.push('the sample never signalled x-ready');

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
          for (let i = 0; i < 24 && !anyOpenDialog(); i++) await sleep(50);
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
            for (let i = 0; i < 20 && !dlg.open; i++) await sleep(50);
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
          await sleep(120);
        }

        const close = dlg.querySelector('.x-dialog__close') as HTMLElement | null;
        let closeVisible = false;
        if (close) {
          const cs = getComputedStyle(close);
          const r = close.getBoundingClientRect();
          closeVisible =
            cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        }

        const body = dlg.querySelector('.x-dialog__body') as HTMLElement | null;
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
          await sleep(80);
        }

        out.push({ label, rendered: true, hasClose: !!close, closeVisible, hasBody: !!body, pad, padOk, notes });
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

    const noClose = findings.filter((f: any) => f.rendered && !f.closeVisible);
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

    const result = await page.evaluate(async () => {
      const g = [...document.querySelectorAll('details')].find((d) =>
        /dialog/i.test((d.querySelector('summary') || {}).textContent || '')
      ) as HTMLDetailsElement | undefined;
      if (!g) return { ran: false };
      g.open = true;
      await new Promise((r) => setTimeout(r, 600));
      const row = g.querySelector('.behaviors-search-results__row') as HTMLElement | null;
      if (!row) return { ran: false };
      row.click();
      await new Promise((r) => setTimeout(r, 1500));

      const dlg = document.querySelector('.behaviors-live__stage dialog') as HTMLDialogElement | null;
      if (!dlg) return { ran: false };
      try {
        dlg.showModal();
      } catch {
        /* may already be open */
      }
      await new Promise((r) => setTimeout(r, 300));
      const openedBefore = dlg.open;
      const btn = dlg.querySelector('.x-dialog__close') as HTMLElement | null;
      if (btn) btn.click();
      await new Promise((r) => setTimeout(r, 400));
      return { ran: true, openedBefore, openAfter: dlg.open };
    });

    test.skip(!result.ran, 'no dialog sample rendered here');
    expect(result.openedBefore, 'the dialog never opened, so closing proves nothing').toBe(true);
    expect(result.openAfter, 'clicking the close button left the dialog open').toBe(false);
  });

  test('authored content survives the enhancement', async ({ page }) => {
    // The header and body are built by MOVING the authored nodes. If that ever
    // becomes a clone or a re-render, ids and handlers go missing - the failure
    // mode that made the fieldset toggle dead in #999.
    await openBehaviors(page);

    const kept = await page.evaluate(async () => {
      const g = [...document.querySelectorAll('details')].find((d) =>
        /dialog/i.test((d.querySelector('summary') || {}).textContent || '')
      ) as HTMLDetailsElement | undefined;
      if (!g) return null;
      g.open = true;
      await new Promise((r) => setTimeout(r, 600));
      const row = g.querySelector('.behaviors-search-results__row') as HTMLElement | null;
      if (row) row.click();
      await new Promise((r) => setTimeout(r, 1500));
      const dlg = document.querySelector('.behaviors-live__stage dialog');
      if (!dlg) return null;
      const heading = dlg.querySelector(
        '.x-dialog__header h1, .x-dialog__header h2, .x-dialog__header h3'
      );
      const body = dlg.querySelector('.x-dialog__body');
      return {
        headingInHeader: !!heading,
        headingText: heading ? (heading.textContent || '').trim() : null,
        labelledBy: dlg.getAttribute('aria-labelledby'),
        bodyText: (body ? body.textContent || '' : '').trim().slice(0, 60),
      };
    });

    test.skip(!kept, 'no dialog sample rendered here');
    expect(kept!.headingInHeader, 'the authored heading was not moved into the dialog header').toBe(true);
    expect(kept!.headingText, 'the authored heading lost its text').toBeTruthy();
    expect(kept!.bodyText.length, 'the authored body content did not survive').toBeGreaterThan(0);
    expect(kept!.labelledBy, 'aria-labelledby was not pointed at the heading').toBeTruthy();
  });
});
