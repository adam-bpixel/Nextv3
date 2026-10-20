import db from '../../core/db';
import { isRecord } from '../../core/json';

const AFK_COLLECTION = 'afk';
const SUS_COLLECTION = 'susUsers';

export interface AfkStatus {
  reason: string;
  since: number;
}

export async function getAfk(userId: string): Promise<AfkStatus | null> {
  const stored = await db.get(AFK_COLLECTION, userId);
  if (!isRecord(stored)) return null;
  const { reason, since } = stored;
  return typeof reason === 'string' && typeof since === 'number' ? { reason, since } : null;
}

export async function setAfk(userId: string, reason: string): Promise<void> {
  await db.set(AFK_COLLECTION, userId, { reason, since: Date.now() });
}

export async function clearAfk(userId: string): Promise<void> {
  await db.delete(AFK_COLLECTION, userId);
}

export async function listSus(guildId: string): Promise<string[]> {
  const stored = await db.get(SUS_COLLECTION, guildId);
  return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
}

export async function addSus(guildId: string, userId: string): Promise<string[]> {
  const list = await listSus(guildId);
  const next = list.includes(userId) ? list : [...list, userId];
  await db.set(SUS_COLLECTION, guildId, next);
  return next;
}

export async function removeSus(guildId: string, userId: string): Promise<string[]> {
  const next = (await listSus(guildId)).filter((id) => id !== userId);
  await db.set(SUS_COLLECTION, guildId, next);
  return next;
}
