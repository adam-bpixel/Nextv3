import db from '../../core/db';
import { isRecord } from '../../core/json';

const SETTINGS_COLLECTION = 'guildToolSettings';
const REMINDERS_COLLECTION = 'reminders';
const TIMELOCKS_COLLECTION = 'timelocks';

interface GuildToolSettings {
  pollEnabled: boolean;
}

function asSettings(value: unknown): GuildToolSettings {
  const record = isRecord(value) ? value : {};
  return { pollEnabled: record.pollEnabled === true };
}

export async function isPollEnabled(guildId: string): Promise<boolean> {
  return (await asSettings(await db.get(SETTINGS_COLLECTION, guildId))).pollEnabled;
}

export async function setPollEnabled(guildId: string, enabled: boolean): Promise<void> {
  const current = asSettings(await db.get(SETTINGS_COLLECTION, guildId));
  await db.set(SETTINGS_COLLECTION, guildId, { ...current, pollEnabled: enabled });
}

export interface Reminder {
  id: string;
  userId: string;
  guildId: string | null;
  channelId: string | null;
  dueAt: number;
  text: string;
}

export async function scheduleReminder(reminder: Reminder): Promise<void> {
  await db.set(REMINDERS_COLLECTION, reminder.id, reminder);
}

export async function deleteReminder(id: string): Promise<void> {
  await db.delete(REMINDERS_COLLECTION, id);
}

export async function dueReminders(now: number): Promise<Reminder[]> {
  const entries = await db.all(REMINDERS_COLLECTION);
  return entries
    .map((entry) => entry.value as Reminder)
    .filter((reminder) => reminder && typeof reminder.dueAt === 'number' && reminder.dueAt <= now);
}

export interface TimeLock {
  id: string;
  guildId: string;
  channelId: string;
  dueAt: number;
}

export async function scheduleUnlock(lock: TimeLock): Promise<void> {
  await db.set(TIMELOCKS_COLLECTION, lock.id, lock);
}

export async function clearUnlock(id: string): Promise<void> {
  await db.delete(TIMELOCKS_COLLECTION, id);
}

export async function dueUnlocks(now: number): Promise<TimeLock[]> {
  const entries = await db.all(TIMELOCKS_COLLECTION);
  return entries
    .map((entry) => entry.value as TimeLock)
    .filter((lock) => lock && typeof lock.dueAt === 'number' && lock.dueAt <= now);
}
