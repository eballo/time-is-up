/**
 * Every duration the app shows passes through here, so "1:23" means the same
 * thing on the clock, in the summary and in the tab title.
 */

const SECONDS_PER_MINUTE = 60;

function splitMinutesAndSeconds(totalSeconds) {
  const whole = Math.abs(totalSeconds);
  return {
    minutes: Math.floor(whole / SECONDS_PER_MINUTE),
    seconds: whole % SECONDS_PER_MINUTE
  };
}

function pad(seconds) {
  return seconds < 10 ? `0${seconds}` : String(seconds);
}

/** The running clock: "1:23", and "+0:08" once a turn runs over. */
export function formatCountdown(totalSeconds) {
  const { minutes, seconds } = splitMinutesAndSeconds(totalSeconds);
  const sign = totalSeconds < 0 ? "+" : "";
  return `${sign}${minutes}:${pad(seconds)}`;
}

/** A plain elapsed duration for totals and summaries; never negative. */
export function formatDuration(totalSeconds) {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const { minutes, seconds } = splitMinutesAndSeconds(clamped);
  return `${minutes}:${pad(seconds)}`;
}

/** How far a turn ran over or under: "+0:17", "−0:28", "±0:00". */
export function formatDelta(deltaSeconds) {
  if (Math.abs(deltaSeconds) <= 1) return "±0:00";
  const sign = deltaSeconds > 0 ? "+" : "−"; // real minus sign, not a hyphen
  return sign + formatDuration(Math.abs(deltaSeconds));
}

/** A rough total for the estimate line: "8 min". */
export function formatRoughMinutes(totalSeconds) {
  return `${Math.round(totalSeconds / SECONDS_PER_MINUTE)} min`;
}

/** The configured per-person budget, in the reader's locale: "1,5 min". */
export function formatMinuteValue(minutes, locale) {
  const rounded = Math.round(minutes * 100) / 100;
  try {
    return `${rounded.toLocaleString(locale)} min`;
  } catch {
    return `${rounded} min`;
  }
}

export function minutesToSeconds(minutes) {
  return Math.round(minutes * SECONDS_PER_MINUTE);
}

export function secondsToMinutes(seconds) {
  return seconds / SECONDS_PER_MINUTE;
}
