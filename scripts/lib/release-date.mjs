/**
 * The calendar date of a release, in ONE timezone (#1287).
 *
 * `git log --format=%cI` writes the committer date with the committer's OWN UTC
 * offset. Slicing its first ten characters therefore gave a different calendar
 * date depending on who made the commit: a GitHub merge is stamped +00:00, a
 * local commit -05:00, so two releases an hour apart could land on different
 * days and the newer one could look older.
 *
 * US Central, because that is where the owner reads the page, and every date
 * the site shows is Central (src/core/central-time.js, #1553).
 */
import { TIME_ZONE, centralDay } from '../../src/core/central-time.js';

/** The site's one display zone (src/core/central-time.js, #1553). */
export const RELEASE_TZ = TIME_ZONE;

/** 'YYYY-MM-DD' for the instant `iso` names, in RELEASE_TZ. Throws on anything unreadable. */
export function releaseDate(iso) {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`release date: cannot read "${iso}" as a date`);
  }
  return centralDay(instant);
}
