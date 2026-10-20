import { AuditLogEvent, type Guild, type GuildMember, type GuildTextBasedChannel, type TextBasedChannel, type User } from 'discord.js';
import { getWarnSetup } from '../setup/setup.model';
import { addWarning, type Warning } from './warnings.model';

export const DISCORD_MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;
export const DISCORD_MAX_SLOWMODE_SECONDS = 21600;
export const DISCORD_BULK_DELETE_MIN = 1;
export const DISCORD_BULK_DELETE_MAX = 100;
export const NO_REASON = 'No reason given';

export const REFUSALS = {
  cannotBan: "I can't ban that member (their role is above mine).",
  cannotKick: "I can't kick that member (their role is above mine).",
  cannotTimeout: "I can't time out that member.",
  targetIsSelf: "You can't do that to yourself.",
  targetIsOwner: "You can't do that to the server owner.",
  targetOutranksModerator: 'Your highest role must be above theirs to do that.',
  moderatorUnknown: "I couldn't check your roles in this server.",
} as const;

export type Refusal = (typeof REFUSALS)[keyof typeof REFUSALS];

export interface RankedMember {
  id: string;
  user: { username: string };
  roles: { highest: { position: number } };
}

export interface ModeratedMember extends RankedMember {
  guild: { ownerId: string };
  kickable: boolean;
  moderatable: boolean;
  kick(reason?: string): Promise<unknown>;
  timeout(durationMs: number | null, reason?: string): Promise<unknown>;
}

export function auditReason(moderator: RankedMember, reason: string): string {
  return `${moderator.user.username}: ${reason}`;
}

export function guildTextChannel(channel: TextBasedChannel | null): GuildTextBasedChannel {
  if (!channel || channel.isDMBased()) throw new Error('This action needs a server text channel');
  return channel;
}

export function hierarchyRefusal(guild: { ownerId: string }, moderator: RankedMember, targetId: string, target: RankedMember | null): Refusal | null {
  if (targetId === moderator.id) return REFUSALS.targetIsSelf;
  if (targetId === guild.ownerId) return REFUSALS.targetIsOwner;
  if (!target || moderator.id === guild.ownerId) return null;
  return moderator.roles.highest.position > target.roles.highest.position ? null : REFUSALS.targetOutranksModerator;
}

export async function banUser(guild: Guild, moderator: GuildMember, target: User, reason: string): Promise<Refusal | null> {
  const member = await guild.members.fetch(target.id).catch(() => null);
  const refusal = hierarchyRefusal(guild, moderator, target.id, member);
  if (refusal) return refusal;
  if (member && !member.bannable) return REFUSALS.cannotBan;
  await guild.members.ban(target.id, { reason: auditReason(moderator, reason) });
  return null;
}

export async function unbanUser(guild: Guild, userId: string): Promise<boolean> {
  return guild.members.unban(userId).then(
    () => true,
    () => false,
  );
}

export async function kickMember(member: ModeratedMember, moderator: RankedMember, reason: string): Promise<Refusal | null> {
  const refusal = hierarchyRefusal(member.guild, moderator, member.id, member);
  if (refusal) return refusal;
  if (!member.kickable) return REFUSALS.cannotKick;
  await member.kick(auditReason(moderator, reason));
  return null;
}

export async function timeoutMember(member: ModeratedMember, moderator: RankedMember, durationMs: number, reason: string): Promise<Refusal | null> {
  const refusal = hierarchyRefusal(member.guild, moderator, member.id, member);
  if (refusal) return refusal;
  if (!member.moderatable) return REFUSALS.cannotTimeout;
  await member.timeout(Math.min(durationMs, DISCORD_MAX_TIMEOUT_MS), auditReason(moderator, reason));
  return null;
}

export async function removeTimeout(member: ModeratedMember, moderator: RankedMember): Promise<Refusal | null> {
  const refusal = hierarchyRefusal(member.guild, moderator, member.id, member);
  if (refusal) return refusal;
  await member.timeout(null);
  return null;
}

export async function purgeMessages(channel: TextBasedChannel | null, count: number): Promise<number> {
  const deleted = await guildTextChannel(channel).bulkDelete(count, true);
  return deleted.size;
}

export async function setSlowmode(channel: TextBasedChannel | null, seconds: number): Promise<void> {
  await guildTextChannel(channel).setRateLimitPerUser(seconds);
}

export async function setChannelLocked(channel: TextBasedChannel | null, guild: Guild, locked: boolean): Promise<void> {
  const target = guildTextChannel(channel);
  if (target.isThread()) throw new Error('Threads cannot be locked with permission overwrites');
  await target.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: locked ? false : null });
}

export async function warnUser(guild: Guild, target: User, moderator: User, reason: string): Promise<Warning[]> {
  return addWarning(guild.id, target.id, { reason, by: moderator.id, at: Date.now() });
}

export async function syncWarnRole(guild: Guild, member: GuildMember, warningCount: number): Promise<void> {
  const setup = await getWarnSetup(guild.id);
  const tiers = [setup.firstWarnRoleId, setup.secondWarnRoleId, setup.lastWarnRoleId];
  const targetRoleId = warningCount > 0 ? tiers[Math.min(warningCount, tiers.length) - 1] ?? null : null;
  for (const roleId of tiers) {
    if (!roleId || roleId === targetRoleId || !member.roles.cache.has(roleId)) continue;
    await member.roles.remove(roleId).catch(() => undefined);
  }
  if (targetRoleId && !member.roles.cache.has(targetRoleId)) await member.roles.add(targetRoleId).catch(() => undefined);
}

export async function softbanUser(guild: Guild, moderator: GuildMember, target: User, deleteDays: number, reason: string): Promise<Refusal | null> {
  const member = await guild.members.fetch(target.id).catch(() => null);
  const refusal = hierarchyRefusal(guild, moderator, target.id, member);
  if (refusal) return refusal;
  if (member && !member.bannable) return REFUSALS.cannotBan;
  const deleteMessageSeconds = Math.min(Math.max(deleteDays, 0), 7) * 86400;
  const bannedReason = auditReason(moderator, reason);
  await guild.members.ban(target.id, { reason: bannedReason, deleteMessageSeconds });
  await guild.members.unban(target.id, bannedReason).catch(() => undefined);
  return null;
}

export interface AuditLogRecord {
  at: number;
  executorId: string | null;
  reason: string;
}

async function fetchAuditEntries(guild: Guild, type: AuditLogEvent, targetId: string): Promise<AuditLogRecord[]> {
  const logs = await guild.fetchAuditLogs({ type, limit: 50 }).catch(() => null);
  if (!logs) return [];
  return [...logs.entries.values()]
    .filter((entry) => entry.targetId === targetId)
    .map((entry) => ({ at: entry.createdTimestamp, executorId: entry.executorId, reason: entry.reason || NO_REASON }));
}

export async function fetchBanLogs(guild: Guild, targetId: string, limit = 10): Promise<AuditLogRecord[]> {
  const [added, removed] = await Promise.all([
    fetchAuditEntries(guild, AuditLogEvent.MemberBanAdd, targetId),
    fetchAuditEntries(guild, AuditLogEvent.MemberBanRemove, targetId),
  ]);
  return [...added, ...removed].sort((a, b) => b.at - a.at).slice(0, limit);
}

export async function fetchKickLogs(guild: Guild, targetId: string, limit = 10): Promise<AuditLogRecord[]> {
  const entries = await fetchAuditEntries(guild, AuditLogEvent.MemberKick, targetId);
  return entries.sort((a, b) => b.at - a.at).slice(0, limit);
}

export async function fetchTimeoutLogs(guild: Guild, targetId: string, limit = 10): Promise<AuditLogRecord[]> {
  const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 50 }).catch(() => null);
  if (!logs) return [];
  return [...logs.entries.values()]
    .filter((entry) => entry.targetId === targetId && entry.changes.some((change) => change.key === 'communication_disabled_until'))
    .map((entry) => ({ at: entry.createdTimestamp, executorId: entry.executorId, reason: entry.reason || NO_REASON }))
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}
