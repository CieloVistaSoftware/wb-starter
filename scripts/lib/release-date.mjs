/**
 * The calendar date of a release, in ONE timezone (#1287).
 *
 * `git log --format=%cI` writes the committer date with the committer's OWN UTC
 * offset. Slicing its first ten characters therefore gave a different calendar
 * date depending on who made the commit: a GitHub merge is stamped +00:00, a
 * local commit -05:00, so two releases an hour apart could land on different
 * days and the newer one could look older.
 *
 * US Central, because that is where the owner reads the page and where the
 * version badge already shows its time.
 */
export const RELEASE_TZ = 'America/Chicago';

const FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: RELEASE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'YYYY-MM-DD' for the instant `iso` names, in RELEASE_TZ. Throws on anything unreadable. */
export function releaseDate(iso) {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`release date: cannot read "${iso}" as a date`);
  }
  return FORMAT.format(instant);
}
