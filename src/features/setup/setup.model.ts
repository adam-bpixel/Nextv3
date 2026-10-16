import db from '../../core/db';
import { isRecord } from '../../core/json';

const COLLECTION = 'guildSetup';

export interface JailSetup {
  jailerRoleId: string;
  jailedRoleId: string;
  logsChannelId: string;
}

export interface VerificationSetup {
  verifiedRoleId: string;
  verifiedFemaleRoleId: string;
  unverifiedRoleId: string;
  verificatorRoleId: string;
  logsChannelId: string;
}

export interface WarnSetup {
  firstWarnRoleId: string;
  secondWarnRoleId: string;
  lastWarnRoleId: string;
  warnerRoleId: string;
  logsChannelId: string;
}

export interface GuildSetup {
  jail?: JailSetup;
  verification?: VerificationSetup;
  warn?: WarnSetup;
}

function asGuildSetup(value: unknown): GuildSetup {
  return isRecord(value) ? value : {};
}

export async function getGuildSetup(guildId: string): Promise<GuildSetup> {
  return asGuildSetup(await db.get(COLLECTION, guildId));
}

export async function saveJailSetup(guildId: string, data: JailSetup): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), jail: data });
}

export async function saveVerificationSetup(guildId: string, data: VerificationSetup): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), verification: data });
}

export async function saveWarnSetup(guildId: string, data: WarnSetup): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), warn: data });
}
