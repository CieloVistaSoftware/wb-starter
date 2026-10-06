/**
 * <div x-alert dismissible>'s close button must actually remove the alert on click.
 *
 * Root cause: schema-builder.js's buildStructure() always wiped an element's
 * innerHTML and, for an empty $view (alert/button/card/demo — the behavior
 * owns the DOM, not the schema), restored it by serializing element.innerHTML
 * to a string (data.content) then reassigning it. WB.observe()'s MutationObserver
 * independently calls processSchema() on reparented elements (e.g. demo.js
 * moving pre-existing children into its grid); when the schema wasn't cached
 * yet, that on-demand fetch could resolve AFTER feedback.js's alert() had
 * already built the real dismiss button with its click listener attached —
 * the late buildStructure() call then wiped and reparsed it from a string,
 * producing a listener-less look-alike. Confirmed live via CDP
 * (DOMDebugger.getEventListeners) and addEventListener tracing: the visible
 * close button had zero listeners ~90% of loads. Fixed by never touching
 * innerHTML at all when $view is empty.
 */
import { test, expect } from '../fixtures/offline';
import { openBehaviorsPanel, renderVariant, EXAMPLE_ROOT } from '../utils/behaviors-panel';

// The showcase builds its examples on demand since #664 -- there are no alerts
// on the page until a row is picked, so counting page-wide [role="alert"]
// found 0. Render the dismissible variant (the x-alert row whose variant
// column reads "true") in the live panel and dismiss THAT alert.
test('dismissible alert close button removes the alert on click, on a fresh page load', async ({ page }) => {
  await openBehaviorsPanel(page, 'x-alert');
  await renderVariant(page, 'x-alert', 'true');

  const alert = page.locator(`${EXAMPLE_ROOT} [x-alert][dismissible]`);
  await expect(alert, 'expected the dismissible alert in the live panel').toHaveCount(1);
  await expect(alert).toHaveAttribute('x-ready', '');

  await alert.locator('.x-alert__close').click();

  await expect(alert, 'clicking the dismiss button should remove the alert').toHaveCount(0);
});
