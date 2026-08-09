import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #390 / #304: pages/behaviors.html ("?page=behaviors") is meant to
 * showcase x-* attribute behaviors on plain/native elements — NOT full
 * wb-* custom component demos, which already have their own home
 * (pages/components.html, "Components Library"). It had drifted to mix
 * 12+ wb-* component demos in (wb-alert, wb-badge, wb-progress,
 * wb-spinner, wb-modal, wb-drawer, wb-tabs, wb-accordion, wb-audio,
 * wb-rating, wb-switch), reported live twice by John and previously
 * filed as #304 but never fixed. Cleaned up (component demos removed,
 * section notes updated to point at Components instead) alongside this
 * test, which is the actual build-time gate preventing it drifting back.
 *
 * `<wb-demo>` itself and the header's single functional `<wb-themecontrol>`
 * (real UI chrome, not a demo of the behavior) are exempt.
 */
const EXEMPT_TAGS = new Set(['wb-demo', 'wb-themecontrol']);

test('behaviors.html contains no wb-* custom component demos', () => {
  const filePath = path.join(process.cwd(), 'pages', 'behaviors.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const tags = new Set<string>();
  for (const m of html.matchAll(/<(wb-[a-z0-9-]+)[\s/>]/gi)) {
    tags.add(m[1].toLowerCase());
  }
  const violations = [...tags].filter((t) => !EXEMPT_TAGS.has(t));
  expect(violations).toEqual([]);
});

test('newbehaviors.html (explicitly marked archived/unused) has been deleted, not left to rot', () => {
  const filePath = path.join(process.cwd(), 'pages', 'newbehaviors.html');
  expect(fs.existsSync(filePath)).toBe(false);
});
