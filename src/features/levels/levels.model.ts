import type { Guild, GuildMember, Role } from 'discord.js';
import type { Range } from '../../core/config';
import config from '../../core/config';
import db from '../../core/db';
import { isRecord } from '../../core/json';
import { xpBoostMultiplier } from '../owner/owner.model';
import { getGuildSetup } from '../setup/setup.model';

export interface LevelProgress {
  xp: number;
  level: number;
  last: number;
}

export type LevelKind = 'chat' | 'voice';

const LEVELS_COLLECTION = 'levels';
const MS_PER_SECOND = 1000;
const EMPTY_PROGRESS: LevelProgress = { xp: 0, level: 0, last: 0 };

export const xpToNextLevel = (level: number): number => 5 * level * level + 50 * level + 100;

const progressKey = (guildId: string, userId: string, kind: LevelKind): string => `${guildId}:${userId}:${kind}`;

function parseProgress(value: unknown): LevelProgress {
  if (!isRecord(value)) return { ...EMPTY_PROGRESS };
  const { xp, level, last } = value;
  return {
    xp: typeof xp === 'number' ? xp : 0,
    level: typeof level === 'number' ? level : 0,
    last: typeof last === 'number' ? last : 0,
  };
}

function settingsFor(kind: LevelKind): { xpRange: Range; cooldownSeconds: number } {
  return kind === 'chat'
    ? { xpRange: config.levels.chat.xpPerMessage, cooldownSeconds: config.levels.chat.cooldownSeconds }
    : { xpRange: config.levels.voice.xpPerInterval, cooldownSeconds: config.levels.voice.intervalSeconds };
}

export async function get(guildId: string, userId: string, kind: LevelKind): Promise<LevelProgress> {
  return parseProgress(await db.get(LEVELS_COLLECTION, progressKey(guildId, userId, kind)));
}

export async function topInGuild(guildId: string, kind: LevelKind, limit: number): Promise<{ userId: string; progress: LevelProgress }[]> {
  const prefix = `${guildId}:`;
  const suffix = `:${kind}`;
  const entries = await db.all(LEVELS_COLLECTION);
  return entries
    .filter((entry) => entry.key.startsWith(prefix) && entry.key.endsWith(suffix))
    .map((entry) => ({ userId: entry.key.slice(prefix.length, -suffix.length), progress: parseProgress(entry.value) }))
    .sort((a, b) => b.progress.level - a.progress.level || b.progress.xp - a.progress.xp)
    .slice(0, limit);
}

function cumulativeXp(progress: LevelProgress): number {
  let total = progress.xp;
  for (let level = 0; level < progress.level; level += 1) total += xpToNextLevel(level);
  return total;
}

export interface CombinedTopEntry {
  userId: string;
  totalXp: number;
  chatLevel: number;
  voiceLevel: number;
}

export async function topCombinedInGuild(guildId: string, limit: number): Promise<CombinedTopEntry[]> {
  const prefix = `${guildId}:`;
  const perUser = new Map<string, { chat?: LevelProgress; voice?: LevelProgress }>();
  for (const entry of await db.all(LEVELS_COLLECTION)) {
    if (!entry.key.startsWith(prefix)) continue;
    const rest = entry.key.slice(prefix.length);
    const separator = rest.lastIndexOf(':');
    if (separator === -1) continue;
    const userId = rest.slice(0, separator);
    const kind = rest.slice(separator + 1);
    if (kind !== 'chat' && kind !== 'voice') continue;
    const bucket = perUser.get(userId) ?? {};
    bucket[kind] = parseProgress(entry.value);
    perUser.set(userId, bucket);
  }
  return [...perUser.entries()]
    .map(([userId, { chat, voice }]) => ({
      userId,
      totalXp: cumulativeXp(chat ?? EMPTY_PROGRESS) + cumulativeXp(voice ?? EMPTY_PROGRESS),
      chatLevel: chat?.level ?? 0,
      voiceLevel: voice?.level ?? 0,
    }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit);
}

export async function award(guildId: string, userId: string, kind: LevelKind): Promise<number | null> {
  const { xpRange, cooldownSeconds } = settingsFor(kind);
  const [lowXp, highXp] = xpRange;
  const progress = await get(guildId, userId, kind);
  if (Date.now() - progress.last < cooldownSeconds * MS_PER_SECOND) return null;
  progress.last = Date.now();
  const earnedXp = lowXp + Math.floor(Math.random() * (highXp - lowXp + 1));
  progress.xp += Math.floor(earnedXp * await xpBoostMultiplier(userId));
  let reachedLevel: number | null = null;
  while (progress.xp >= xpToNextLevel(progress.level)) {
    progress.xp -= xpToNextLevel(progress.level);
    progress.level += 1;
    reachedLevel = progress.level;
  }
  await db.set(LEVELS_COLLECTION, progressKey(guildId, userId, kind), progress);
  return reachedLevel;
}

export async function grantLevelRoles(guild: Guild, member: GuildMember, kind: LevelKind, level: number): Promise<void> {
  const setup = await getGuildSetup(guild.id);
  const entries = (setup.levelRoles ?? []).filter((entry) => entry.kind === kind && entry.level <= level);
  if (!entries.length) return;
  const me = await guild.members.fetchMe();
  const roles = entries
    .map((entry) => guild.roles.cache.get(entry.roleId))
    .filter((role): role is Role => role !== undefined && !role.managed && role.position < me.roles.highest.position && !member.roles.cache.has(role.id));
  if (roles.length) await member.roles.add(roles, `Level role (${kind} level ${level})`);
}
