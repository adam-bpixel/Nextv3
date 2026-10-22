import 'dotenv/config';
import type { Server } from 'node:http';
import config from './core/config';
import db from './core/db';
import * as state from './core/state';
import { BotClient } from './core/client';
import { attachEvents, loadAll } from './core/loader';
import { startApiServer } from './api/server';
import { loadSavedDevice } from './features/botcontrol/botcontrol.model';
import { bootFleet, destroyAllFleetClients } from './features/fleet/fleet.manager';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

export const client = new BotClient();
attachEvents(client, loadAll(client));

let apiServer: Server | null = null;

function warnAboutMisnamedEnvironment(): void {
  if (process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.warn('MONGO_URI is set but this bot reads MONGODB_URI. Set MONGODB_URI to connect to MongoDB.');
  }
}

async function shutDown(signal: string): Promise<void> {
  console.log(`${signal} received: saving data and disconnecting.`);
  apiServer?.close();
  await destroyAllFleetClients();
  await db.flush();
  await client.destroy();
  process.exit(0);
}

async function main(): Promise<void> {
  if (!config.token) {
    console.error('Set DISCORD_TOKEN in a .env file first (copy .env.example).');
    process.exit(1);
  }
  warnAboutMisnamedEnvironment();
  await db.connect();
  await state.load();
  await loadSavedDevice().catch(() => undefined);
  for (const signal of SHUTDOWN_SIGNALS) process.once(signal, (received) => void shutDown(received));
  await client.login(config.token);
  apiServer = startApiServer(client);
  await bootFleet().catch((error: unknown) => console.error('Reconnecting managed bots failed:', error));
}

main().catch((error: unknown) => {
  console.error('Start-up failed:', error);
  process.exit(1);
});
