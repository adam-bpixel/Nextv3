import db from '../../core/db';
import { isRecord } from '../../core/json';

export interface Warning {
  reason: string;
  by: string;
  at: number;
}

const WARNINGS_COLLECTION = 'warnings';

const warningsKey = (guildId: string, userId: string): string => `${guildId}:${userId}`;

function parseWarning(value: unknown): Warning | null {
  if (!isRecord(value)) return null;
  const { reason, by, at } = value;
  return typeof reason === 'string' && typeof by === 'string' && typeof at === 'number' ? { reason, by, at } : null;
}

export async function listWarnings(guildId: string, userId: string): Promise<Warning[]> {
  const stored = await db.get(WARNINGS_COLLECTION, warningsKey(guildId, userId));
  if (!Array.isArray(stored)) return [];
  return stored.map(parseWarning).filter((warning): warning is Warning => warning !== null);
}

export async function addWarning(guildId: string, userId: string, warning: Warning): Promise<Warning[]> {
  const warnings = [...(await listWarnings(guildId, userId)), warning];
  await db.set(WARNINGS_COLLECTION, warningsKey(guildId, userId), warnings);
  return warnings;
}

export async function removeLastWarning(guildId: string, userId: string): Promise<Warning[]> {
  const warnings = (await listWarnings(guildId, userId)).slice(0, -1);
  await db.set(WARNINGS_COLLECTION, warningsKey(guildId, userId), warnings);
  return warnings;
}

export async function clearWarnings(guildId: string, userId: string): Promise<void> {
  await db.set(WARNINGS_COLLECTION, warningsKey(guildId, userId), []);
}
