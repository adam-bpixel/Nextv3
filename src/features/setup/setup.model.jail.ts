import db from '../../core/db';
import { COLLECTION, getGuildSetup, type JailSetup, MAX_SETUP_ROLE_LIST, normalizeJailSetup } from './setup.model.core';

export async function getJailSetup(guildId: string): Promise<JailSetup> {
  return (await getGuildSetup(guildId)).jail;
}

export async function setJailerRoles(guildId: string, roleIds: readonly string[]): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeJailSetup(setup.jail);
  await db.set(COLLECTION, guildId, { ...setup, jail: { ...current, jailerRoleIds: roleIds.slice(0, MAX_SETUP_ROLE_LIST) } });
}

export async function setJailedRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeJailSetup(setup.jail);
  await db.set(COLLECTION, guildId, { ...setup, jail: { ...current, jailedRoleId: roleId } });
}

export async function setJailLogsChannel(guildId: string, channelId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeJailSetup(setup.jail);
  await db.set(COLLECTION, guildId, { ...setup, jail: { ...current, logsChannelId: channelId } });
}
