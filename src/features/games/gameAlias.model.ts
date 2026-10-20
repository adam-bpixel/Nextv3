import db from '../../core/db';
import { isRecord } from '../../core/json';

const COLLECTION = 'gameAliases';

export interface GameAlias {
  guildId: string;
  alias: string;
  roleId: string;
  addedBy: string;
  addedAt: number;
}

const key = (guildId: string, alias: string): string => `${guildId}:${alias.toLowerCase()}`;

function parse(value: unknown): GameAlias | null {
  if (!isRecord(value)) return null;
  const { guildId, alias, roleId, addedBy, addedAt } = value;
  if (typeof guildId !== 'string' || typeof alias !== 'string' || typeof roleId !== 'string') return null;
  return {
    guildId,
    alias,
    roleId,
    addedBy: typeof addedBy === 'string' ? addedBy : '',
    addedAt: typeof addedAt === 'number' ? addedAt : 0,
  };
}

export async function setGameAlias(guildId: string, alias: string, roleId: string, addedBy: string): Promise<void> {
  await db.set(COLLECTION, key(guildId, alias), { guildId, alias: alias.toLowerCase(), roleId, addedBy, addedAt: Date.now() });
}

export async function getGameAlias(guildId: string, alias: string): Promise<GameAlias | null> {
  return parse(await db.get(COLLECTION, key(guildId, alias)));
}

export async function removeGameAlias(guildId: string, alias: string): Promise<boolean> {
  if (!(await getGameAlias(guildId, alias))) return false;
  await db.delete(COLLECTION, key(guildId, alias));
  return true;
}

export async function removeGameAliasesByRole(guildId: string, roleId: string): Promise<GameAlias[]> {
  const removed = (await listGameAliases(guildId)).filter((entry) => entry.roleId === roleId);
  for (const entry of removed) await db.delete(COLLECTION, key(guildId, entry.alias));
  return removed;
}

export async function listGameAliases(guildId: string): Promise<GameAlias[]> {
  return (await db.allByField(COLLECTION, 'guildId', guildId))
    .map(({ value }) => parse(value))
    .filter((entry): entry is GameAlias => entry !== null)
    .sort((a, b) => a.alias.localeCompare(b.alias));
}
