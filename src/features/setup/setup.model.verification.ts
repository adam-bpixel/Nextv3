import db from '../../core/db';
import { COLLECTION, getGuildSetup, MAX_SETUP_ROLE_LIST, normalizeVerificationSetup, type VerificationSetup } from './setup.model.core';

export async function getVerificationSetup(guildId: string): Promise<VerificationSetup> {
  return (await getGuildSetup(guildId)).verification;
}

export async function setVerifiedRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeVerificationSetup(setup.verification);
  await db.set(COLLECTION, guildId, { ...setup, verification: { ...current, verifiedRoleId: roleId } });
}

export async function setVerifiedFemaleRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeVerificationSetup(setup.verification);
  await db.set(COLLECTION, guildId, { ...setup, verification: { ...current, verifiedFemaleRoleId: roleId } });
}

export async function setUnverifiedRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeVerificationSetup(setup.verification);
  await db.set(COLLECTION, guildId, { ...setup, verification: { ...current, unverifiedRoleId: roleId } });
}

export async function setVerificatorRoles(guildId: string, roleIds: readonly string[]): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeVerificationSetup(setup.verification);
  await db.set(COLLECTION, guildId, { ...setup, verification: { ...current, verificatorRoleIds: roleIds.slice(0, MAX_SETUP_ROLE_LIST) } });
}

export async function setVerificationLogsChannel(guildId: string, channelId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeVerificationSetup(setup.verification);
  await db.set(COLLECTION, guildId, { ...setup, verification: { ...current, logsChannelId: channelId } });
}
