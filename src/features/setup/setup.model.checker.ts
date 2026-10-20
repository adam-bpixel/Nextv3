import db from '../../core/db';
import { COLLECTION, getGuildSetup } from './setup.model.core';

export const MAX_CHECKER_ROLES = 7;

export async function getCheckerRoles(guildId: string): Promise<string[]> {
  return (await getGuildSetup(guildId)).checkerRoleIds ?? [];
}

export async function setCheckerRoles(guildId: string, roleIds: readonly string[]): Promise<void> {
  const setup = await getGuildSetup(guildId);
  await db.set(COLLECTION, guildId, { ...setup, checkerRoleIds: roleIds.slice(0, MAX_CHECKER_ROLES) });
}
