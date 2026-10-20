import crypto from 'node:crypto';
import db from '../../core/db';
import { COLLECTION, getGuildSetup, type LevelRoleEntry } from './setup.model.core';

export const MAX_LEVEL_ROLES = 25;
export const MIN_LEVEL_ROLE_LEVEL = 1;
export const MAX_LEVEL_ROLE_LEVEL = 1000;

export async function addLevelRole(guildId: string, entry: Omit<LevelRoleEntry, 'id'>): Promise<LevelRoleEntry[]> {
  const setup = await getGuildSetup(guildId);
  const existing = setup.levelRoles ?? [];
  if (existing.some((candidate) => candidate.kind === entry.kind && candidate.level === entry.level)) {
    throw new Error(`There is already a ${entry.kind} level role for level ${entry.level}.`);
  }
  if (existing.length >= MAX_LEVEL_ROLES) throw new Error(`You can add up to ${MAX_LEVEL_ROLES} level roles.`);
  const levelRoles = [...existing, { id: crypto.randomBytes(4).toString('hex'), ...entry }].sort((a, b) => a.level - b.level);
  await db.set(COLLECTION, guildId, { ...setup, levelRoles });
  return levelRoles;
}

export async function removeLevelRole(guildId: string, id: string): Promise<LevelRoleEntry[]> {
  const setup = await getGuildSetup(guildId);
  const levelRoles = (setup.levelRoles ?? []).filter((entry) => entry.id !== id);
  await db.set(COLLECTION, guildId, { ...setup, levelRoles });
  return levelRoles;
}
