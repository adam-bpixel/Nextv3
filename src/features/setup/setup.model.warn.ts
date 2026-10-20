import db from '../../core/db';
import { COLLECTION, getGuildSetup, MAX_SETUP_ROLE_LIST, normalizeWarnSetup, type WarnSetup } from './setup.model.core';

export async function getWarnSetup(guildId: string): Promise<WarnSetup> {
  return (await getGuildSetup(guildId)).warn;
}

export async function setFirstWarnRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeWarnSetup(setup.warn);
  await db.set(COLLECTION, guildId, { ...setup, warn: { ...current, firstWarnRoleId: roleId } });
}

export async function setSecondWarnRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeWarnSetup(setup.warn);
  await db.set(COLLECTION, guildId, { ...setup, warn: { ...current, secondWarnRoleId: roleId } });
}

export async function setLastWarnRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeWarnSetup(setup.warn);
  await db.set(COLLECTION, guildId, { ...setup, warn: { ...current, lastWarnRoleId: roleId } });
}

export async function setWarnerRoles(guildId: string, roleIds: readonly string[]): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeWarnSetup(setup.warn);
  await db.set(COLLECTION, guildId, { ...setup, warn: { ...current, warnerRoleIds: roleIds.slice(0, MAX_SETUP_ROLE_LIST) } });
}

export async function setWarnLogsChannel(guildId: string, channelId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeWarnSetup(setup.warn);
  await db.set(COLLECTION, guildId, { ...setup, warn: { ...current, logsChannelId: channelId } });
}
