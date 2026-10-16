import type { Guild } from 'discord.js';
import { saveJailSetup, saveVerificationSetup, saveWarnSetup, type JailSetup, type VerificationSetup, type WarnSetup } from './setup.model';

export const ROLE_REFERENCE = /^<@&(\d{15,22})>$|^(\d{15,22})$/;
export const CHANNEL_REFERENCE = /^<#(\d{15,22})>$|^(\d{15,22})$/;

export function extractId(token: string | undefined, pattern: RegExp): string | null {
  const match = pattern.exec(token ?? '');
  return match ? match[1] ?? match[2] ?? null : null;
}

const ROLES_MISSING = "One of those roles doesn't exist in this server.";
const CHANNEL_MISSING = "That channel doesn't exist in this server.";

export type FinalizeResult<T> = { data: T } | { error: string };

export async function finalizeJailSetup(guild: Guild, jailerRoleId: string, jailedRoleId: string, logsChannelId: string): Promise<FinalizeResult<JailSetup>> {
  const [jailerRole, jailedRole, channel] = await Promise.all([
    guild.roles.fetch(jailerRoleId).catch(() => null),
    guild.roles.fetch(jailedRoleId).catch(() => null),
    guild.channels.fetch(logsChannelId).catch(() => null),
  ]);
  if (!jailerRole || !jailedRole) return { error: ROLES_MISSING };
  if (!channel) return { error: CHANNEL_MISSING };
  const data: JailSetup = { jailerRoleId, jailedRoleId, logsChannelId };
  await saveJailSetup(guild.id, data);
  return { data };
}

export async function finalizeVerificationSetup(
  guild: Guild,
  verifiedRoleId: string,
  verifiedFemaleRoleId: string,
  unverifiedRoleId: string,
  verificatorRoleId: string,
  logsChannelId: string,
): Promise<FinalizeResult<VerificationSetup>> {
  const [verifiedRole, verifiedFemaleRole, unverifiedRole, verificatorRole, channel] = await Promise.all([
    guild.roles.fetch(verifiedRoleId).catch(() => null),
    guild.roles.fetch(verifiedFemaleRoleId).catch(() => null),
    guild.roles.fetch(unverifiedRoleId).catch(() => null),
    guild.roles.fetch(verificatorRoleId).catch(() => null),
    guild.channels.fetch(logsChannelId).catch(() => null),
  ]);
  if (!verifiedRole || !verifiedFemaleRole || !unverifiedRole || !verificatorRole) return { error: ROLES_MISSING };
  if (!channel) return { error: CHANNEL_MISSING };
  const data: VerificationSetup = { verifiedRoleId, verifiedFemaleRoleId, unverifiedRoleId, verificatorRoleId, logsChannelId };
  await saveVerificationSetup(guild.id, data);
  return { data };
}

export async function finalizeWarnSetup(
  guild: Guild,
  firstWarnRoleId: string,
  secondWarnRoleId: string,
  lastWarnRoleId: string,
  warnerRoleId: string,
  logsChannelId: string,
): Promise<FinalizeResult<WarnSetup>> {
  const [firstWarnRole, secondWarnRole, lastWarnRole, warnerRole, channel] = await Promise.all([
    guild.roles.fetch(firstWarnRoleId).catch(() => null),
    guild.roles.fetch(secondWarnRoleId).catch(() => null),
    guild.roles.fetch(lastWarnRoleId).catch(() => null),
    guild.roles.fetch(warnerRoleId).catch(() => null),
    guild.channels.fetch(logsChannelId).catch(() => null),
  ]);
  if (!firstWarnRole || !secondWarnRole || !lastWarnRole || !warnerRole) return { error: ROLES_MISSING };
  if (!channel) return { error: CHANNEL_MISSING };
  const data: WarnSetup = { firstWarnRoleId, secondWarnRoleId, lastWarnRoleId, warnerRoleId, logsChannelId };
  await saveWarnSetup(guild.id, data);
  return { data };
}
