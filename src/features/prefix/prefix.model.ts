import config from '../../core/config';
import db from '../../core/db';

const COLLECTION = 'guildPrefixes';
const USER_COLLECTION = 'userPrefixes';
const MAX_PREFIX_LENGTH = 10;
const cache = new Map<string, string>();
const userCache = new Map<string, string>();

function validPrefix(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_PREFIX_LENGTH && !/\s/.test(value);
}

export async function getGuildPrefix(guildId: string | null): Promise<string> {
  if (!guildId) return config.prefix;
  const cached = cache.get(guildId);
  if (cached !== undefined) return cached;
  const stored = await db.get(COLLECTION, guildId);
  if (!validPrefix(stored)) return config.prefix;
  cache.set(guildId, stored);
  return stored;
}

export async function setGuildPrefix(guildId: string, prefix: string): Promise<void> {
  await db.set(COLLECTION, guildId, prefix);
  cache.set(guildId, prefix);
}

export async function resetGuildPrefix(guildId: string): Promise<void> {
  await db.delete(COLLECTION, guildId);
  cache.delete(guildId);
}

export async function getUserPrefix(userId: string): Promise<string | null> {
  const cached = userCache.get(userId);
  if (cached !== undefined) return cached;
  const stored = await db.get(USER_COLLECTION, userId);
  if (!validPrefix(stored)) return null;
  userCache.set(userId, stored);
  return stored;
}

export async function setUserPrefix(userId: string, prefix: string): Promise<void> {
  await db.set(USER_COLLECTION, userId, prefix);
  userCache.set(userId, prefix);
}

export async function resetUserPrefix(userId: string): Promise<void> {
  await db.delete(USER_COLLECTION, userId);
  userCache.delete(userId);
}

export function isValidPrefix(prefix: string): boolean {
  return validPrefix(prefix);
}
