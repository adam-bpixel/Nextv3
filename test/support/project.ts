import fs from 'node:fs';
import path from 'node:path';
import { BotClient } from '../../src/core/client';
import { loadAll, type LoadedEvent } from '../../src/core/loader';
import { commandRoute } from '../../src/core/router';
import type { InteractionRoute } from '../../src/core/types';

export const PROJECT_ROOT = path.join(__dirname, '..', '..');
export const SRC_DIR = path.join(PROJECT_ROOT, 'src');
export const TEST_DIR = path.join(PROJECT_ROOT, 'test');
export const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

export interface LoadedBot {
  client: BotClient;
  events: LoadedEvent[];
  routes: InteractionRoute[];
}

let cached: LoadedBot | null = null;

export function loadBot(): LoadedBot {
  if (cached) return cached;
  const client = new BotClient();
  const events = loadAll(client);
  cached = { client, events, routes: [commandRoute, ...client.routes] };
  return cached;
}

export function listFiles(dir: string, extension: RegExp): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, extension);
    return extension.test(entry.name) ? [full] : [];
  });
}

export const relative = (file: string): string => path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
