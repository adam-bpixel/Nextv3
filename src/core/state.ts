import db from './db';
import { isRecord } from './json';

export interface Screen {
  flow: string;
  state: string;
}

const SCREENS_COLLECTION = 'screens';
const MAX_SCREENS_IN_MEMORY = 5000;
const screens = new Map<string, Screen>();

export function parseScreen(value: unknown): Screen | null {
  if (!isRecord(value)) return null;
  const { flow, state } = value;
  return typeof flow === 'string' && typeof state === 'string' ? { flow, state } : null;
}

async function dropOldestBeyondLimit(): Promise<void> {
  while (screens.size > MAX_SCREENS_IN_MEMORY) {
    const oldest = screens.keys().next();
    if (oldest.done) return;
    screens.delete(oldest.value);
    await db.delete(SCREENS_COLLECTION, oldest.value);
  }
}

export async function load(): Promise<void> {
  for (const { key, value } of await db.all(SCREENS_COLLECTION)) {
    const screen = parseScreen(value);
    if (screen) screens.set(key, screen);
  }
  await dropOldestBeyondLimit();
}

export function get(messageId: string): Screen | null {
  return screens.get(messageId) ?? null;
}

export async function set(messageId: string, flowId: string, stateId: string): Promise<void> {
  const screen: Screen = { flow: flowId, state: stateId };
  screens.delete(messageId);
  screens.set(messageId, screen);
  await db.set(SCREENS_COLLECTION, messageId, screen);
  await dropOldestBeyondLimit();
}
