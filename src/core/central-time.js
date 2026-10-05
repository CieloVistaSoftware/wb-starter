/**
 * Every date and time the site shows, in US Central (#1553).
 *
 * John, 2026-10-05: "make all datetime use cst". Release dates (#1287) and the
 * version badge were already Central; everything else formatted in the
 * viewer's own zone, so one page could show 5 PM and another 22:00 for the
 * same moment. Display goes through these functions; stored timestamps stay
 * ISO (UTC) -- this is only how they are written for a person to read.
 *
 * America/Chicago, not a fixed UTC-6: it is CDT (UTC-5) until the first
 * Sunday of November and CST (UTC-6) after, and the label says which.
 *
 * Pure functions, no DOM. Node scripts import it too (scripts/lib/release-date.mjs).
 * A classic (non-module) <script> cannot import, so loading this module also
 * sets `window.WBTime` to the same functions.
 */

export const TIME_ZONE = 'America/Chicago';

const formats = {
  // 2026-10-05: sorts as text, for keys and file-like dates.
  day: new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }),
  // Oct 5, 2026
  date: new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric' }),
  // 5:12:09 PM CDT
  time: new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }),
  // 5:12 PM CDT
  clock: new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
  // Oct 5, 2026, 5:12 PM CDT
  dateTime: new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
};

/**
 * @param {Date|string|number} value
 * @returns {Date|null} null when the value is not a readable instant
 */
function toInstant(value) {
  const instant = value instanceof Date ? value : new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/**
 * @param {keyof typeof formats} kind
 * @returns {(value?: Date|string|number) => string}
 */
function formatter(kind) {
  return (value = new Date()) => {
    const instant = toInstant(value);
    return instant ? formats[kind].format(instant) : String(value ?? '');
  };
}

/** 'YYYY-MM-DD' in Central. */
export const centralDay = formatter('day');
/** 'Oct 5, 2026' in Central. */
export const centralDate = formatter('date');
/** '5:12:09 PM CDT'. */
export const centralTime = formatter('time');
/** '5:12 PM CDT'. */
export const centralClock = formatter('clock');
/** 'Oct 5, 2026, 5:12 PM CDT'. */
export const centralDateTime = formatter('dateTime');

/**
 * The wall-clock hours, minutes and seconds of `value` in `timeZone` (24-hour),
 * for a live clock that draws its own digits (x-clock). Throws RangeError on
 * an unknown zone, so the caller can say which name was wrong.
 *
 * @param {Date|string|number} [value]
 * @param {string} [timeZone]
 * @returns {{ hours: number, minutes: number, seconds: number }}
 */
export function clockParts(value = new Date(), timeZone = TIME_ZONE) {
  const instant = toInstant(value) || new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant);
  const read = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { hours: read('hour'), minutes: read('minute'), seconds: read('second') };
}

if (typeof window !== 'undefined') {
  window.WBTime = Object.freeze({
    TIME_ZONE,
    day: centralDay,
    date: centralDate,
    time: centralTime,
    clock: centralClock,
    dateTime: centralDateTime,
  });
}
