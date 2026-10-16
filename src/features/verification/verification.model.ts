import db from '../../core/db';
import { isRecord } from '../../core/json';

export type VerificationKind = 'male' | 'female';

export interface VerificationLog {
  kind: VerificationKind;
  by: string;
  at: number;
}

export interface TopVerifier {
  verifierId: string;
  count: number;
}

const VERIFICATION_LOGS_COLLECTION = 'verificationLogs';

const logKey = (guildId: string, userId: string): string => `${guildId}:${userId}`;

function parseLog(value: unknown): VerificationLog | null {
  if (!isRecord(value)) return null;
  const { kind, by, at } = value;
  return (kind === 'male' || kind === 'female') && typeof by === 'string' && typeof at === 'number' ? { kind, by, at } : null;
}

function parseLogs(value: unknown): VerificationLog[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseLog).filter((log): log is VerificationLog => log !== null);
}

export async function listVerificationLogs(guildId: string, userId: string): Promise<VerificationLog[]> {
  return parseLogs(await db.get(VERIFICATION_LOGS_COLLECTION, logKey(guildId, userId)));
}

export async function addVerificationLog(guildId: string, userId: string, log: VerificationLog): Promise<void> {
  const logs = [...(await listVerificationLogs(guildId, userId)), log];
  await db.set(VERIFICATION_LOGS_COLLECTION, logKey(guildId, userId), logs);
}

export async function topVerifiers(guildId: string, limit: number): Promise<TopVerifier[]> {
  const prefix = `${guildId}:`;
  const counts = new Map<string, number>();
  for (const entry of await db.all(VERIFICATION_LOGS_COLLECTION)) {
    if (!entry.key.startsWith(prefix)) continue;
    for (const log of parseLogs(entry.value)) counts.set(log.by, (counts.get(log.by) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([verifierId, count]) => ({ verifierId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
