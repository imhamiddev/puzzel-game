// Asia/Tehran is a fixed UTC+03:30 offset (Iran abolished DST in 2022),
// so we can convert a "wall clock" Tehran time to a UTC instant with a
// simple fixed offset rather than needing a timezone database.
const TEHRAN_OFFSET_MINUTES = 3 * 60 + 30;

/**
 * Takes the value of an <input type="datetime-local"> (e.g. "2026-08-01T14:30"),
 * interpreted as Tehran local time, and returns the equivalent UTC Date.
 */
export function tehranLocalToUtc(datetimeLocalValue: string): Date | null {
  if (!datetimeLocalValue) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(datetimeLocalValue);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  // Treat the given components as Tehran time, then shift to UTC.
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute) - TEHRAN_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMs);
}

/** Formats a UTC Date as an Asia/Tehran wall-clock string for display. */
export function formatTehranTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
