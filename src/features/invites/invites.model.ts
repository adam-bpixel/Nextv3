import db from '../../core/db';
import { isRecord } from '../../core/json';

const JOINS_COLLECTION = 'inviteJoins';

export interface InviteJoinRecord {
  guildId: string;
  memberId: string;
  inviterId: string | null;
  fake: boolean;
  left: boolean;
  at: number;
}

const joinKey = (guildId: string, memberId: string): string => `${guildId}:${memberId}`;

function parseJoin(value: unknown): InviteJoinRecord | null {
  if (!isRecord(value)) return null;
  const { guildId, memberId, inviterId, fake, left, at } = value;
  if (typeof guildId !== 'string' || typeof memberId !== 'string') return null;
  return {
    guildId,
    memberId,
    inviterId: typeof inviterId === 'string' ? inviterId : null,
    fake: fake === true,
    left: left === true,
    at: typeof at === 'number' ? at : 0,
  };
}

export async function recordJoin(record: InviteJoinRecord): Promise<void> {
  await db.set(JOINS_COLLECTION, joinKey(record.guildId, record.memberId), record);
}

export async function getJoin(guildId: string, memberId: string): Promise<InviteJoinRecord | null> {
  return parseJoin(await db.get(JOINS_COLLECTION, joinKey(guildId, memberId)));
}

export async function markLeft(guildId: string, memberId: string): Promise<void> {
  const record = await getJoin(guildId, memberId);
  if (!record) return;
  await recordJoin({ ...record, left: true });
}

async function joinsInvitedBy(guildId: string, inviterId: string): Promise<InviteJoinRecord[]> {
  return (await db.allByField(JOINS_COLLECTION, 'inviterId', inviterId))
    .map((entry) => parseJoin(entry.value))
    .filter((record): record is InviteJoinRecord => record !== null && record.guildId === guildId);
}

export interface InviterStats {
  joins: number;
  leaves: number;
  fake: number;
}

export async function statsFor(guildId: string, userId: string): Promise<InviterStats> {
  const records = await joinsInvitedBy(guildId, userId);
  return {
    joins: records.filter((record) => !record.fake).length,
    leaves: records.filter((record) => !record.fake && record.left).length,
    fake: records.filter((record) => record.fake).length,
  };
}

export interface TopInviter {
  userId: string;
  joins: number;
  leaves: number;
  total: number;
}

export async function topInviters(guildId: string, limit: number): Promise<TopInviter[]> {
  const prefix = `${guildId}:`;
  const counts = new Map<string, { joins: number; leaves: number }>();
  for (const entry of await db.all(JOINS_COLLECTION)) {
    if (!entry.key.startsWith(prefix)) continue;
    const record = parseJoin(entry.value);
    if (!record || record.fake || record.inviterId === null) continue;
    const bucket = counts.get(record.inviterId) ?? { joins: 0, leaves: 0 };
    bucket.joins += 1;
    if (record.left) bucket.leaves += 1;
    counts.set(record.inviterId, bucket);
  }
  return [...counts.entries()]
    .map(([userId, { joins, leaves }]) => ({ userId, joins, leaves, total: joins - leaves }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
