import type { Page } from '@playwright/test';

/**
 * What counts as a broken SAME-ORIGIN request on a demo page (#1116).
 *
 * Two different browser events report a resource that did not load, and they
 * are classified separately on purpose:
 *
 *   - `response` with status >= 400 -- the server answered and said no (a 404
 *     schema, a 500 module). Always broken, whatever the resource type. A media
 *     file that 404s arrives HERE, not through `requestfailed`.
 *   - `requestfailed` -- no usable response ever arrived (connection reset, an
 *     aborted module fetch, a blocked request). Broken, with ONE exception.
 *
 * The exception: a media element opens a ranged request, buffers what it needs,
 * and cancels the rest. Chrome reports that cancel as `net::ERR_ABORTED` on a
 * `media` resource while the element sits at readyState 4 with `error: null`.
 * That is normal playback, not a broken resource. Measured on
 * demos/autoinject.html 2026-09-12: 4 players, 4 requests, each 206 then
 * ERR_ABORTED, every element fully loaded.
 *
 * The exemption is deliberately the narrowest one that covers that case: the
 * resource type must be `media` AND the error text must be exactly
 * `net::ERR_ABORTED`. "Ignore aborted media" must never widen into "ignore
 * media" -- that is how #514 and #763 happened, a check that stopped looking.
 *
 * Cross-origin failures are ignored by design: external CDN/image/audio
 * flakiness is not the demo's fault.
 */

/** The three facts about a failed request the classification depends on. */
export interface FailedRequestFacts {
  url: string;
  /** Playwright's `request.resourceType()`: document, script, media, fetch, ... */
  resourceType: string;
  /** Playwright's `request.failure()?.errorText`; '' when failure() is null. */
  errorText: string;
}

/** True when `url` is served by the dev server at `origin`. No origin means nothing is same-origin. */
export function isSameOrigin(url: string, origin: string): boolean {
  return Boolean(origin) && url.startsWith(origin);
}

/** The one failure that is normal browser behaviour: a media fetch cancelled after buffering. */
export function isBufferingAbort(facts: FailedRequestFacts): boolean {
  return facts.resourceType === 'media' && facts.errorText === 'net::ERR_ABORTED';
}

/**
 * Classify a `requestfailed` event. Returns the report line for a broken
 * same-origin request, or null when the failure is not the demo's defect.
 */
export function describeFailedRequest(facts: FailedRequestFacts, origin: string): string | null {
  if (!isSameOrigin(facts.url, origin)) return null;
  if (isBufferingAbort(facts)) return null;
  return `FAILED ${facts.errorText} ${facts.url.replace(origin, '')}`.trim();
}

/**
 * Classify a `response` event. Returns the report line for a same-origin
 * response with status >= 400, or null otherwise. Resource type is NOT
 * consulted: a media 404 is broken.
 */
export function describeErrorResponse(url: string, status: number, origin: string): string | null {
  if (!isSameOrigin(url, origin)) return null;
  if (status < 400) return null;
  return `${status} ${url.replace(origin, '')}`;
}

/**
 * Attach both listeners to `page` and return the live list they fill. This is
 * the one wiring all-demos-smoke uses, so a browser-level guard that calls it
 * exercises exactly the handlers the gate runs.
 */
export function watchBrokenRequests(page: Page, origin: string): string[] {
  const broken: string[] = [];
  page.on('response', (res) => {
    const line = describeErrorResponse(res.url(), res.status(), origin);
    if (line) broken.push(line);
  });
  page.on('requestfailed', (req) => {
    const line = describeFailedRequest(
      { url: req.url(), resourceType: req.resourceType(), errorText: req.failure()?.errorText ?? '' },
      origin,
    );
    if (line) broken.push(line);
  });
  return broken;
}
