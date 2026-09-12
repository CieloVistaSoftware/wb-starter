import { test, expect, type Page } from '@playwright/test';

/**
 * REGRESSION (#792): `x-footer` must BUILD its declared `links` and `social`,
 * not merely read them.
 *
 * THE DEFECT. footer.schema.json declares `links` (JSON `[{label, href}]`) and
 * `social` (JSON `[{platform, href}]`), and footer.css has always styled
 * `.x-footer__nav` / `.x-footer__link` / `.x-footer__social` /
 * `.x-footer__social-link`, but footer.js never built any of them. A footer that
 * declared links showed an empty box where its navigation should be.
 *
 * WHY THE PREVIOUS GUARD DOES NOT PROVE THE FIX.
 * `tests/behaviors/every-declared-attribute.spec.ts` compares a probe's markup
 * with and without an attribute, so it proves an attribute CHANGES something.
 * It cannot tell a rendered list of anchors from any other difference, and it
 * never checks structure, text, hrefs, accessibility names, sanitising or
 * idempotence. This spec asserts the built structure itself.
 *
 * WHAT IS ASSERTED, for both input formats src/wb-viewmodels/footer.js accepts
 * (JSON arrays, and the comma-separated fallback its usage block documents):
 *   - exactly one `nav.x-footer__nav[aria-label="Footer"]`, holding one
 *     `a.x-footer__link` per link, with the right text and href
 *   - exactly one `nav.x-footer__social[aria-label="Social"]`, holding one
 *     `a.x-footer__social-link` per entry, each with `aria-label` and `title`
 *     equal to the platform (the glyph carries no accessible name)
 *   - a `javascript:` href is rewritten to `#`, including a mixed-case one with
 *     leading whitespace, in both lists
 *   - a second `WB.scan()` AND a direct second `footer()` call leave the
 *     structure identical. The scan alone is not enough, because WB.inject()
 *     dedupes by behavior name and would hide a missing guard inside footer().
 *
 * HOW IT FAILS AGAINST THE OLD CODE. The old footer() never reads `links` or
 * `social`, so `nav.x-footer__nav` does not exist: the first assertion
 * ("exactly one links nav", expected 1, received 0) fails in every test.
 *
 * TWO RUNTIMES. wb.js (the SPA and doc-viewer) and wb-lazy.js (27 demo pages)
 * both run footer(). They are asserted separately because they differ in one
 * way that matters here. wb-lazy builds a host's schema `$view` BEFORE the
 * behavior runs (`buildSchemaIfNeeded()` -> `SchemaBuilder.processElement()`),
 * and footer.schema.json's `$view` creates an EMPTY `nav.x-footer__social`
 * (`createdWhen: social`) plus an empty `nav.x-footer__center`. footer.js
 * guards its social build with `!element.querySelector('.x-footer__social')`,
 * which that empty schema nav satisfies. Read from source, not run: the
 * wb-lazy block is therefore EXPECTED TO BE RED on the current tree for
 * everything social. That is a real gap in the fix, not a test error.
 *
 * Law 11: bare attributes only, no data-*. No sleeps: every wait is
 * `WB.whenIdle()`.
 */

const FIXTURE = '/tests/fixtures/blank.html';

type Runtime = { name: string; module: string; lazy: boolean };
const RUNTIMES: Runtime[] = [
  { name: 'wb.js', module: '/src/core/wb.js', lazy: false },
  { name: 'wb-lazy.js', module: '/src/core/wb-lazy.js', lazy: true },
];

/** Render markup into a clean page through the given runtime and wait until WB is idle. */
async function render(page: Page, runtime: Runtime, markup: string) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ html, mod, lazy }) => {
    const host = document.createElement('div');
    host.id = 'harness';
    host.innerHTML = html;
    document.body.appendChild(host);
    const m: any = await import(mod);
    const WB = m.default || m.WB;
    (window as any).__WB = WB;
    (window as any).__lazy = lazy;
    if (lazy) {
      await WB.scan(host, { eager: true });
    } else {
      await WB.init({ scan: false, observe: false });
      await WB.scan(host);
    }
    await WB.whenIdle({ timeout: 10000 });
  }, { html: markup, mod: runtime.module, lazy: runtime.lazy });
}

type Snapshot = {
  navCount: number;
  navLabel: string | null;
  links: { text: string; href: string | null }[];
  socialNavCount: number;
  socialLabel: string | null;
  social: { text: string; href: string | null; ariaLabel: string | null; title: string | null }[];
  javascriptHrefs: string[];
};

/** Everything footer() is responsible for, read from the live DOM. */
function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const f = document.querySelector('#harness footer') as HTMLElement;
    const navs = f.querySelectorAll('nav.x-footer__nav');
    const socialNavs = f.querySelectorAll('nav.x-footer__social');
    return {
      navCount: navs.length,
      navLabel: navs[0]?.getAttribute('aria-label') ?? null,
      links: Array.from(f.querySelectorAll('nav.x-footer__nav > a.x-footer__link')).map((a) => ({
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href'),
      })),
      socialNavCount: socialNavs.length,
      socialLabel: socialNavs[0]?.getAttribute('aria-label') ?? null,
      social: Array.from(f.querySelectorAll('nav.x-footer__social > a.x-footer__social-link')).map((a) => ({
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href'),
        ariaLabel: a.getAttribute('aria-label'),
        title: a.getAttribute('title'),
      })),
      javascriptHrefs: Array.from(f.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href') || '')
        .filter((h) => /^\s*javascript:/i.test(h)),
    };
  });
}

const JSON_MARKUP =
  `<footer x-footer ` +
  `links='[{"label":"Privacy","href":"/privacy"},{"label":"Terms","href":"/terms"},{"label":"Evil","href":"javascript:alert(1)"}]' ` +
  `social='[{"platform":"github","href":"https://github.com/acme"},{"platform":"mastodon","href":"https://mastodon.social/@acme"},{"platform":"myspace","href":" JavaScript:alert(2)"}]'>` +
  `</footer>`;

const COMMA_MARKUP = `<footer x-footer links="Privacy, Terms ,Contact" social="github, x"></footer>`;

for (const runtime of RUNTIMES) {
  test.describe(`x-footer builds links and social (#792) — ${runtime.name}`, () => {
    test('JSON links render as one anchor each, inside one labelled nav', async ({ page }) => {
      await render(page, runtime, JSON_MARKUP);
      const s = await snapshot(page);

      expect(s.navCount, 'exactly one links nav (.x-footer__nav) — the old footer() built none').toBe(1);
      expect(s.navLabel, 'the links nav must be labelled for assistive tech').toBe('Footer');
      expect(s.links).toEqual([
        { text: 'Privacy', href: '/privacy' },
        { text: 'Terms', href: '/terms' },
        { text: 'Evil', href: '#' },
      ]);
    });

    test('JSON social renders as labelled icon links, inside one labelled nav', async ({ page }) => {
      await render(page, runtime, JSON_MARKUP);
      const s = await snapshot(page);

      expect(s.socialNavCount, 'exactly one social nav (.x-footer__social)').toBe(1);
      expect(s.socialLabel, 'the social nav must be labelled for assistive tech').toBe('Social');
      expect(s.social.map(({ href, ariaLabel, title }) => ({ href, ariaLabel, title })),
        'one .x-footer__social-link per entry, each named by its platform').toEqual([
        { href: 'https://github.com/acme', ariaLabel: 'github', title: 'github' },
        { href: 'https://mastodon.social/@acme', ariaLabel: 'mastodon', title: 'mastodon' },
        { href: '#', ariaLabel: 'myspace', title: 'myspace' },
      ]);
      // A known platform shows its icon, never an empty link. An unknown
      // platform falls back to showing its own name.
      expect(s.social[0].text, 'github should render a visible glyph').not.toBe('');
      expect(s.social[0].text, 'a known platform renders its glyph, not its name').not.toBe('github');
      expect(s.social[2].text, 'an unknown platform renders as its own name').toBe('myspace');
    });

    test('javascript: hrefs are neutralised to # in both lists', async ({ page }) => {
      await render(page, runtime, JSON_MARKUP);
      const s = await snapshot(page);

      // Precondition, or the empty list below would pass on a footer that
      // rendered nothing at all.
      expect(s.links.length + s.social.length, 'precondition: the footer rendered its anchors').toBe(6);
      expect(s.javascriptHrefs, 'no anchor may carry a javascript: URL').toEqual([]);
      expect(s.links.find((l) => l.text === 'Evil')?.href).toBe('#');
      expect(s.social.find((l) => l.ariaLabel === 'myspace')?.href, 'mixed-case, space-prefixed JavaScript: too').toBe('#');
    });

    test('the comma-separated fallback renders labels with placeholder hrefs', async ({ page }) => {
      await render(page, runtime, COMMA_MARKUP);
      const s = await snapshot(page);

      expect(s.navCount, 'exactly one links nav').toBe(1);
      expect(s.links, 'each comma-separated entry becomes a trimmed label with href="#"').toEqual([
        { text: 'Privacy', href: '#' },
        { text: 'Terms', href: '#' },
        { text: 'Contact', href: '#' },
      ]);
      expect(s.socialNavCount, 'exactly one social nav').toBe(1);
      expect(s.social.map(({ href, ariaLabel, title }) => ({ href, ariaLabel, title }))).toEqual([
        { href: '#', ariaLabel: 'github', title: 'github' },
        { href: '#', ariaLabel: 'x', title: 'x' },
      ]);
    });

    test('a second scan and a direct second footer() call do not render twice', async ({ page }) => {
      await render(page, runtime, JSON_MARKUP);
      const first = await snapshot(page);
      expect(first.navCount, 'precondition: the first render built the links nav').toBe(1);
      expect(first.social.length, 'precondition: the first render built the social links').toBe(3);

      await page.evaluate(async () => {
        const WB = (window as any).__WB;
        const host = document.getElementById('harness') as HTMLElement;
        // The real-world path: something scans the same subtree again.
        if ((window as any).__lazy) await WB.scan(host, { eager: true });
        else await WB.scan(host);
        await WB.whenIdle({ timeout: 10000 });
        // WB.inject() dedupes by behavior name, so the scan above cannot reach
        // footer() twice. Call it directly to exercise footer()'s own guards.
        const { footer } = await import('/src/wb-viewmodels/footer.js');
        footer(host.querySelector('footer') as HTMLElement);
      });

      const second = await snapshot(page);
      expect(second, 'the footer structure must be identical after a re-scan and a re-run').toEqual(first);
    });
  });
}
