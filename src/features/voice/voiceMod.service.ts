import { AuditLogEvent, type Guild, type GuildBasedChannel, type VoiceBasedChannel } from 'discord.js';
import { NO_REASON, type AuditLogRecord } from '../moderation/moderation.service';

const CHANNEL_REF = /^<#(\d{15,22})>$|^(\d{15,22})$/;

export function resolveChannel(guild: Guild, ref: string | undefined): GuildBasedChannel | null {
  const match = CHANNEL_REF.exec(ref ?? '');
  const id = match?.[1] ?? match?.[2];
  if (!id) return null;
  return guild.channels.cache.get(id) ?? null;
}

export function resolveVoiceChannel(guild: Guild, ref: string | undefined): VoiceBasedChannel | null {
  const channel = resolveChannel(guild, ref);
  return channel?.isVoiceBased() ? channel : null;
}

export async function fetchVoiceLogs(guild: Guild, targetId: string, limit = 10): Promise<AuditLogRecord[]> {
  const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 50 }).catch(() => null);
  if (!logs) return [];
  return [...logs.entries.values()]
    .filter((entry) => entry.targetId === targetId && entry.changes.some((change) => change.key === 'mute' || change.key === 'deaf'))
    .map((entry) => ({ at: entry.createdTimestamp, executorId: entry.executorId, reason: entry.reason || NO_REASON }))
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}
