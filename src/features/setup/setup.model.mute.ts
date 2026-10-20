import db from '../../core/db';
import { COLLECTION, getGuildSetup, MAX_SETUP_ROLE_LIST, type MuteSetup, normalizeMuteSetup } from './setup.model.core';

export async function getMuteSetup(guildId: string): Promise<MuteSetup> {
  return (await getGuildSetup(guildId)).mute;
}

export async function setMuterRoles(guildId: string, roleIds: readonly string[]): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeMuteSetup(setup.mute);
  await db.set(COLLECTION, guildId, { ...setup, mute: { ...current, muterRoleIds: roleIds.slice(0, MAX_SETUP_ROLE_LIST) } });
}

export async function setMutedRole(guildId: string, roleId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeMuteSetup(setup.mute);
  await db.set(COLLECTION, guildId, { ...setup, mute: { ...current, mutedRoleId: roleId } });
}

export async function setMuteLogsChannel(guildId: string, channelId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const current = normalizeMuteSetup(setup.mute);
  await db.set(COLLECTION, guildId, { ...setup, mute: { ...current, logsChannelId: channelId } });
}
