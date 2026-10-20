import db from '../../core/db';
import { COLLECTION, getGuildSetup } from './setup.model.core';

export const MAX_AUTO_ROLES = 4;

export async function addAutoRole(guildId: string, roleId: string): Promise<string[]> {
  const setup = await getGuildSetup(guildId);
  const existing = setup.autoRoleIds ?? [];
  if (existing.includes(roleId)) return existing;
  if (existing.length >= MAX_AUTO_ROLES) throw new Error(`You can add up to ${MAX_AUTO_ROLES} auto roles.`);
  const autoRoleIds = [...existing, roleId];
  await db.set(COLLECTION, guildId, { ...setup, autoRoleIds });
  return autoRoleIds;
}

export async function removeAutoRole(guildId: string, roleId: string): Promise<string[]> {
  const setup = await getGuildSetup(guildId);
  const autoRoleIds = (setup.autoRoleIds ?? []).filter((id) => id !== roleId);
  await db.set(COLLECTION, guildId, { ...setup, autoRoleIds });
  return autoRoleIds;
}
