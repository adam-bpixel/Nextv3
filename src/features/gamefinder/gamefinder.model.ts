import db from '../../core/db';
import { MS_PER_MINUTE } from '../../core/format';
import { isRecord } from '../../core/json';

const COLLECTION = 'gameFinderSettings';
const COOLDOWNS_COLLECTION = 'gameFinderCooldowns';

export const MAX_GAMES = 15;
export const DEFAULT_GAMEFINDER_COOLDOWN_MS = 30 * MS_PER_MINUTE;
export const GAMEFINDER_MANAGER_COOLDOWN_FACTOR = 0.5;
export const GAMEFINDER_TAG_PREFIX = 'gamefinder:tag:';
export const GAMEFINDER_TAG_SELECT_ID = 'gamefinder:tag:select';

export type GameFinderPanelStyle = 'buttons' | 'select';

export interface GameFinderGame {
  id: string;
  name: string;
  roleId: string;
  emoji?: string;
}

export interface GameFinderSettings {
  games: GameFinderGame[];
  cooldownMs: number;
  panelChannelId: string | null;
  managerRoleId: string | null;
  panelStyle: GameFinderPanelStyle;
  bannerURL?: string;
}

function defaultSettings(): GameFinderSettings {
  return { games: [], cooldownMs: DEFAULT_GAMEFINDER_COOLDOWN_MS, panelChannelId: null, managerRoleId: null, panelStyle: 'buttons' };
}

function asSettings(value: unknown): GameFinderSettings {
  if (!isRecord(value)) return defaultSettings();
  return {
    games: Array.isArray(value.games) ? (value.games as GameFinderGame[]) : [],
    cooldownMs: typeof value.cooldownMs === 'number' ? value.cooldownMs : DEFAULT_GAMEFINDER_COOLDOWN_MS,
    panelChannelId: typeof value.panelChannelId === 'string' ? value.panelChannelId : null,
    managerRoleId: typeof value.managerRoleId === 'string' ? value.managerRoleId : null,
    panelStyle: value.panelStyle === 'select' ? 'select' : 'buttons',
    ...(typeof value.bannerURL === 'string' ? { bannerURL: value.bannerURL } : {}),
  };
}

export async function getGameFinderSettings(guildId: string): Promise<GameFinderSettings> {
  return asSettings(await db.get(COLLECTION, guildId));
}

export async function addGame(guildId: string, game: GameFinderGame): Promise<GameFinderGame[]> {
  const settings = await getGameFinderSettings(guildId);
  if (settings.games.length >= MAX_GAMES) throw new Error(`You can add up to ${MAX_GAMES} games.`);
  if (settings.games.some((existing) => existing.roleId === game.roleId)) throw new Error('That role is already used by another game.');
  const games = [...settings.games, game];
  await db.set(COLLECTION, guildId, { ...settings, games });
  return games;
}

export async function removeGame(guildId: string, gameId: string): Promise<GameFinderGame[]> {
  const settings = await getGameFinderSettings(guildId);
  const games = settings.games.filter((game) => game.id !== gameId);
  await db.set(COLLECTION, guildId, { ...settings, games });
  return games;
}

export async function saveGameFinderOptions(
  guildId: string,
  patch: { cooldownMs: number; panelChannelId: string | null; managerRoleId: string | null; panelStyle: GameFinderPanelStyle; bannerURL?: string },
): Promise<GameFinderSettings> {
  const settings = await getGameFinderSettings(guildId);
  const updated: GameFinderSettings = { ...settings, ...patch };
  await db.set(COLLECTION, guildId, updated);
  return updated;
}

const cooldownKey = (guildId: string, gameId: string, userId: string): string => `${guildId}:${gameId}:${userId}`;

export async function cooldownRemainingMs(guildId: string, gameId: string, userId: string): Promise<number> {
  const until = Number(await db.get(COOLDOWNS_COLLECTION, cooldownKey(guildId, gameId, userId))) || 0;
  return Math.max(0, until - Date.now());
}

export async function startCooldown(guildId: string, gameId: string, userId: string, cooldownMs: number): Promise<void> {
  await db.set(COOLDOWNS_COLLECTION, cooldownKey(guildId, gameId, userId), Date.now() + cooldownMs);
}
