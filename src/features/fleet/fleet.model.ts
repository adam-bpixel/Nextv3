import db from '../../core/db';
import { isRecord } from '../../core/json';

const BOTS = 'botFleet';
const ASSIGNMENTS = 'botFleetAssignments';
const COUNTERS = 'botFleetCounters';

export type FleetBotStatus = 'online' | 'offline';

export interface FleetBot {
  id: string;
  token: string;
  name: string;
  addedBy: string;
  addedAt: number;
  status: FleetBotStatus;
}

function parse(id: string, value: unknown): FleetBot | null {
  if (!isRecord(value)) return null;
  const { token, name, addedBy, addedAt, status } = value;
  if (typeof token !== 'string' || typeof name !== 'string') return null;
  return {
    id,
    token,
    name,
    addedBy: typeof addedBy === 'string' ? addedBy : '',
    addedAt: typeof addedAt === 'number' ? addedAt : 0,
    status: status === 'online' ? 'online' : 'offline',
  };
}

export async function nextFleetBotId(): Promise<string> {
  const previous = await db.get(COUNTERS, 'botId');
  const id = (typeof previous === 'number' ? previous : 0) + 1;
  await db.set(COUNTERS, 'botId', id);
  return String(id);
}

export async function saveFleetBot(bot: FleetBot): Promise<void> {
  await db.set(BOTS, bot.id, { token: bot.token, name: bot.name, addedBy: bot.addedBy, addedAt: bot.addedAt, status: bot.status });
}

export async function getFleetBot(id: string): Promise<FleetBot | null> {
  return parse(id, await db.get(BOTS, id));
}

export async function listFleetBots(): Promise<FleetBot[]> {
  return (await db.all(BOTS))
    .map(({ key, value }) => parse(key, value))
    .filter((bot): bot is FleetBot => bot !== null)
    .sort((a, b) => a.addedAt - b.addedAt);
}

export async function findFleetBotByToken(token: string): Promise<FleetBot | null> {
  return (await listFleetBots()).find((bot) => bot.token === token) ?? null;
}

export async function findFleetBotByName(name: string): Promise<FleetBot | null> {
  const lowered = name.toLowerCase();
  return (await listFleetBots()).find((bot) => bot.id === name || bot.name.toLowerCase() === lowered) ?? null;
}

export async function setFleetBotStatus(id: string, status: FleetBotStatus): Promise<void> {
  const bot = await getFleetBot(id);
  if (!bot) return;
  await saveFleetBot({ ...bot, status });
}

export async function deleteFleetBot(id: string): Promise<void> {
  await db.delete(BOTS, id);
  for (const entry of await db.all(ASSIGNMENTS)) {
    if (entry.value === id) await db.delete(ASSIGNMENTS, entry.key);
  }
}

export async function getGuildAssignment(guildId: string): Promise<string | null> {
  const value = await db.get(ASSIGNMENTS, guildId);
  return typeof value === 'string' ? value : null;
}

export async function setGuildAssignment(guildId: string, botId: string): Promise<void> {
  await db.set(ASSIGNMENTS, guildId, botId);
}

export async function clearGuildAssignment(guildId: string): Promise<void> {
  await db.delete(ASSIGNMENTS, guildId);
}

export async function isAssignedBot(selfFleetId: string | null, guildId: string | null): Promise<boolean> {
  if (!guildId) return true;
  const assigned = await getGuildAssignment(guildId);
  return (assigned ?? 'main') === (selfFleetId ?? 'main');
}
