/**
 * Video durations written by the content team: "mm:ss" or "h:mm:ss" (e.g. "12:30", "1:04:20").
 * Returns milliseconds, or `null` when the text is not a valid, non-zero duration.
 */
export function parseDuration(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return null;

  const isValid = parts.every((part, index) =>
    index === 0 ? /^\d{1,3}$/.test(part) : /^[0-5]\d$/.test(part),
  );
  if (!isValid) return null;

  const [hours = 0, minutes = 0, seconds = 0] = (parts.length === 3 ? parts : ['0', ...parts]).map(
    Number,
  );
  const ms = ((hours * 60 + minutes) * 60 + seconds) * 1000;
  return ms > 0 ? ms : null;
}
