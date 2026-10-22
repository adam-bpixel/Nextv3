import type { PresenceStatusData } from 'discord.js';
import db from '../../core/db';
import { setDeviceKey } from '../../core/botDevice';

const COLLECTION = 'botControl';

export interface StatusInfo {
  readonly label: string;
  readonly emoji: string;
  readonly aliases?: readonly string[];
}

export const STATUSES: Readonly<Record<string, StatusInfo>> = {
  online: { label: 'Online', emoji: '🟢' },
  idle: { label: 'Idle', emoji: '🌙' },
  dnd: { label: 'Do Not Disturb', emoji: '⛔', aliases: ['donotdisturb'] },
  invisible: { label: 'Invisible', emoji: '⚫', aliases: ['offline'] },
};

export function resolveStatus(input: string | null | undefined): (StatusInfo & { key: PresenceStatusData }) | null {
  const key = input?.trim().toLowerCase();
  if (!key) return null;
  const direct = STATUSES[key];
  if (direct) return { key: key as PresenceStatusData, ...direct };
  const found = Object.entries(STATUSES).find(([, status]) => status.aliases?.includes(key));
  return found ? { key: found[0] as PresenceStatusData, ...found[1] } : null;
}

export async function savedStatus(): Promise<PresenceStatusData | null> {
  const value = await db.get(COLLECTION, 'status');
  return typeof value === 'string' ? (resolveStatus(value)?.key ?? null) : null;
}

export async function saveStatus(status: string): Promise<void> {
  await db.set(COLLECTION, 'status', status);
}

export async function savedDevice(): Promise<string | null> {
  const value = await db.get(COLLECTION, 'device');
  return typeof value === 'string' ? value : null;
}

export async function saveDevice(device: string): Promise<void> {
  await db.set(COLLECTION, 'device', device);
  setDeviceKey(device);
}

export async function loadSavedDevice(): Promise<void> {
  const device = await savedDevice();
  if (device) setDeviceKey(device);
}

let usernameCheckerEnabled: boolean | null = null;

export async function isUsernameCheckerEnabled(): Promise<boolean> {
  if (usernameCheckerEnabled === null) usernameCheckerEnabled = (await db.get(COLLECTION, 'usernameChecker')) !== false;
  return usernameCheckerEnabled;
}

export async function setUsernameCheckerEnabled(enabled: boolean): Promise<void> {
  await db.set(COLLECTION, 'usernameChecker', enabled);
  usernameCheckerEnabled = enabled;
}
