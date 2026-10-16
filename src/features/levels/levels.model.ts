import config from '../../core/config';
import db from '../../core/db';
import { isRecord } from '../../core/json';

export interface LevelProgress {
  xp: number;
  level: number;
  last: number;
}

const LEVELS_COLLECTION = 'levels';
const MS_PER_SECOND = 1000;
const EMPTY_PROGRESS: LevelProgress = { xp: 0, level: 0, last: 0 };

export const xpToNextLevel = (level: number): number => 5 * level * level + 50 * level + 100;

const progressKey = (guildId: string, userId: string): string => `${guildId}:${userId}`;

function parseProgress(value: unknown): LevelProgress {
  if (!isRecord(value)) return { ...EMPTY_PROGRESS };
  const { xp, level, last } = value;
  return {
    xp: typeof xp === 'number' ? xp : 0,
    level: typeof level === 'number' ? level : 0,
    last: typeof last === 'number' ? last : 0,
  };
}

export async function get(guildId: string, userId: string): Promise<LevelProgress> {
  return parseProgress(await db.get(LEVELS_COLLECTION, progressKey(guildId, userId)));
}

export async function topInGuild(guildId: string, limit: number): Promise<{ userId: string; progress: LevelProgress }[]> {
  const prefix = `${guildId}:`;
  const entries = await db.all(LEVELS_COLLECTION);
  return entries
    .filter((entry) => entry.key.startsWith(prefix))
    .map((entry) => ({ userId: entry.key.slice(prefix.length), progress: parseProgress(entry.value) }))
    .sort((a, b) => b.progress.level - a.progress.level || b.progress.xp - a.progress.xp)
    .slice(0, limit);
}

export async function award(guildId: string, userId: string): Promise<number | null> {
  const { xpPerMessage, cooldownSeconds } = config.levels;
  const [lowXp, highXp] = xpPerMessage;
  const progress = await get(guildId, userId);
  if (Date.now() - progress.last < cooldownSeconds * MS_PER_SECOND) return null;
  progress.last = Date.now();
  progress.xp += lowXp + Math.floor(Math.random() * (highXp - lowXp + 1));
  let reachedLevel: number | null = null;
  while (progress.xp >= xpToNextLevel(progress.level)) {
    progress.xp -= xpToNextLevel(progress.level);
    progress.level += 1;
    reachedLevel = progress.level;
  }
  await db.set(LEVELS_COLLECTION, progressKey(guildId, userId), progress);
  return reachedLevel;
}
