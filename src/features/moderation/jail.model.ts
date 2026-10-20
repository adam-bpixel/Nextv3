import db from '../../core/db';
import { isRecord } from '../../core/json';

export type JailAction = 'jail' | 'unjail';

export interface JailedMember {
  roleIds: string[];
  reason: string;
  by: string;
  at: number;
}

export interface JailLog {
  action: JailAction;
  reason: string;
  by: string;
  at: number;
}

const JAILED_COLLECTION = 'jailedMembers';
const JAIL_LOGS_COLLECTION = 'jailLogs';

const key = (guildId: string, userId: string): string => `${guildId}:${userId}`;

function parseJailedMember(value: unknown): JailedMember | null {
  if (!isRecord(value)) return null;
  const { roleIds, reason, by, at } = value;
  if (!Array.isArray(roleIds) || typeof reason !== 'string' || typeof by !== 'string' || typeof at !== 'number') return null;
  return { roleIds: roleIds.filter((id): id is string => typeof id === 'string'), reason, by, at };
}

export async function getJailedMember(guildId: string, userId: string): Promise<JailedMember | null> {
  return parseJailedMember(await db.get(JAILED_COLLECTION, key(guildId, userId)));
}

export async function setJailedMember(guildId: string, userId: string, member: JailedMember): Promise<void> {
  await db.set(JAILED_COLLECTION, key(guildId, userId), member);
}

export async function removeJailedMember(guildId: string, userId: string): Promise<void> {
  await db.delete(JAILED_COLLECTION, key(guildId, userId));
}

function parseJailLog(value: unknown): JailLog | null {
  if (!isRecord(value)) return null;
  const { action, reason, by, at } = value;
  return (action === 'jail' || action === 'unjail') && typeof reason === 'string' && typeof by === 'string' && typeof at === 'number'
    ? { action, reason, by, at }
    : null;
}

function parseJailLogs(value: unknown): JailLog[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseJailLog).filter((log): log is JailLog => log !== null);
}

export async function listJailLogs(guildId: string, userId: string): Promise<JailLog[]> {
  return parseJailLogs(await db.get(JAIL_LOGS_COLLECTION, key(guildId, userId)));
}

export async function addJailLog(guildId: string, userId: string, log: JailLog): Promise<void> {
  const logs = [...(await listJailLogs(guildId, userId)), log];
  await db.set(JAIL_LOGS_COLLECTION, key(guildId, userId), logs);
}
