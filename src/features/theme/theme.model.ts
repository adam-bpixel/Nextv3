import db from '../../core/db';

const COLLECTION = 'guildThemes';
const HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;

const cache = new Map<string, number>();

export function parseColor(text: string): number | null {
  const match = HEX_COLOR.exec(text.trim());
  const hex = match?.[1];
  return hex ? Number.parseInt(hex, 16) : null;
}

export function cachedColor(guildId: string): number | undefined {
  return cache.get(guildId);
}

export async function loadThemeCache(): Promise<void> {
  cache.clear();
  for (const { key, value } of await db.all(COLLECTION)) {
    if (typeof value === 'number') cache.set(key, value);
  }
}

export async function setGuildColor(guildId: string, color: number): Promise<void> {
  cache.set(guildId, color);
  await db.set(COLLECTION, guildId, color);
}

export async function resetGuildColor(guildId: string): Promise<void> {
  cache.delete(guildId);
  await db.delete(COLLECTION, guildId);
}
