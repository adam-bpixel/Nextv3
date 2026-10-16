export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

const DURATION_PATTERN = /^(\d+)\s*(s|m|h|d|w)?$/i;
const DEFAULT_DURATION_UNIT = 'm';
const MS_PER_UNIT: Readonly<Record<string, number>> = { s: MS_PER_SECOND, m: MS_PER_MINUTE, h: MS_PER_HOUR, d: MS_PER_DAY, w: MS_PER_WEEK };

export type TimestampStyle = 'R' | 'f';

export function discordTimestamp(ms: number, style: TimestampStyle = 'R'): string {
  return `<t:${Math.floor(ms / MS_PER_SECOND)}:${style}>`;
}

export function parseDuration(text: string | undefined, fallbackMs: number): number {
  const match = DURATION_PATTERN.exec(text ?? '');
  if (!match) return fallbackMs;
  const unit = (match[2] ?? DEFAULT_DURATION_UNIT).toLowerCase();
  return Number(match[1]) * (MS_PER_UNIT[unit] ?? MS_PER_MINUTE);
}

export function isDuration(text: string | undefined): boolean {
  return DURATION_PATTERN.test(text ?? '');
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / MS_PER_SECOND);
  const parts: [number, string][] = [
    [Math.floor(totalSeconds / 86400), 'd'],
    [Math.floor(totalSeconds / 3600) % 24, 'h'],
    [Math.floor(totalSeconds / 60) % 60, 'm'],
    [totalSeconds % 60, 's'],
  ];
  return parts.filter(([amount]) => amount).map(([amount, unit]) => `${amount}${unit}`).join(' ') || '0s';
}
