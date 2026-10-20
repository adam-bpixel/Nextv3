import { BotClient } from '../../core/client';
import { attachEvents, loadAll } from '../../core/loader';
import { listFleetBots, setFleetBotStatus, type FleetBot } from './fleet.model';

const runtimeClients = new Map<string, BotClient>();

export function isFleetBotOnline(id: string): boolean {
  return runtimeClients.has(id);
}

export async function startFleetBot(bot: FleetBot): Promise<BotClient> {
  const existing = runtimeClients.get(bot.id);
  if (existing) return existing;
  const client = new BotClient();
  client.fleetId = bot.id;
  attachEvents(client, loadAll(client));
  try {
    await client.login(bot.token);
  } catch (error) {
    await client.destroy().catch(() => undefined);
    throw error;
  }
  runtimeClients.set(bot.id, client);
  await setFleetBotStatus(bot.id, 'online');
  return client;
}

export async function stopFleetBot(id: string): Promise<boolean> {
  const client = runtimeClients.get(id);
  if (!client) {
    await setFleetBotStatus(id, 'offline');
    return false;
  }
  runtimeClients.delete(id);
  await client.destroy().catch(() => undefined);
  await setFleetBotStatus(id, 'offline');
  return true;
}

export async function destroyAllFleetClients(): Promise<void> {
  await Promise.all([...runtimeClients.values()].map((client) => client.destroy().catch(() => undefined)));
  runtimeClients.clear();
}

export async function bootFleet(): Promise<void> {
  for (const bot of await listFleetBots()) {
    if (bot.status !== 'online') continue;
    await startFleetBot(bot).catch((error: unknown) => {
      console.error(`Fleet bot "${bot.name}" (#${bot.id}) failed to reconnect:`, error);
    });
  }
}
