/**
 * Parses a friendly 12-hour time string like "8:00 PM" into hour/minute parts.
 * Falls back to 8:00 PM if the string doesn't match the expected format.
 */
export function parseTime12hToParts(display: string): { hour: number; minute: number } {
  const match = display.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return { hour: 20, minute: 0 };

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

/**
 * Combines a Game's stored date (UTC midnight) with its friendly time string into
 * a single timestamp. Note: this treats the time-of-day as UTC rather than the
 * team's actual local timezone, since no timezone is stored anywhere in the app.
 * That introduces a few hours of skew versus true local time, but since the
 * reminder/deadline check only runs once a day (see Vercel Hobby cron limits),
 * that skew doesn't meaningfully affect which calendar day a threshold is
 * detected on.
 */
export function combineDateAndTime(date: Date, timeDisplay: string): Date {
  const { hour, minute } = parseTime12hToParts(timeDisplay);
  const combined = new Date(date);
  combined.setUTCHours(hour, minute, 0, 0);
  return combined;
}

/** Converts a 24-hour "HH:MM" string (from an <input type="time">) into "8:00 PM" style display. */
export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

/** Converts a "8:00 PM" style display string back into 24-hour "HH:MM" for an <input type="time">. */
export function parse12hTo24h(display: string): string {
  const { hour, minute } = parseTime12hToParts(display);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
