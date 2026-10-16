import 'dotenv/config';
import config from './core/config';
import db from './core/db';
import * as state from './core/state';
import { BotClient } from './core/client';
import { attachEvents, loadAll } from './core/loader';
import { printBanner } from './core/banner';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

export const client = new BotClient();
attachEvents(client, loadAll(client));

function warnAboutMisnamedEnvironment(): void {
  if (process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.warn('MONGO_URI is set but the bot reads MONGODB_URI: storage stays in data/db.json until MONGODB_URI is set.');
  }
}

async function shutDown(signal: string): Promise<void> {
  console.log(`${signal} received: saving data and disconnecting.`);
  await db.flush();
  await client.destroy();
  process.exit(0);
}

async function main(): Promise<void> {
  printBanner();
  if (!config.token) {
    console.error('Set DISCORD_TOKEN in a .env file first (copy .env.example).');
    process.exit(1);
  }
  warnAboutMisnamedEnvironment();
  await db.connect();
  await state.load();
  for (const signal of SHUTDOWN_SIGNALS) process.once(signal, (received) => void shutDown(received));
  await client.login(config.token);
}

main().catch((error: unknown) => {
  console.error('Start-up failed:', error);
  process.exit(1);
});
