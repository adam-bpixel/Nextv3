import type { Guild, GuildMember, User } from 'discord.js';
import db from '../../core/db';
import { isRecord } from '../../core/json';

const COLLECTION = 'tagRoles';
const SYNC_DELAY_MS = 400;
const FETCH_TIMEOUT_MS = 90_000;

export interface TagRoleConfig {
  roleId: string | null;
  enabled: boolean;
}

export async function getTagRole(guildId: string): Promise<TagRoleConfig> {
  const value = await db.get(COLLECTION, guildId);
  if (!isRecord(value)) return { roleId: null, enabled: false };
  return { roleId: typeof value.roleId === 'string' ? value.roleId : null, enabled: value.enabled === true };
}

export async function setTagRole(guildId: string, config: TagRoleConfig): Promise<void> {
  await db.set(COLLECTION, guildId, config);
}

function wearsTag(user: User, guildId: string): boolean {
  return Boolean(user.primaryGuild?.identityEnabled && user.primaryGuild.identityGuildId === guildId);
}

export async function syncMemberTagRole(member: GuildMember, config?: TagRoleConfig): Promise<boolean> {
  if (member.user.bot) return false;
  const current = config ?? (await getTagRole(member.guild.id));
  if (!current.enabled || !current.roleId) return false;
  const role = member.guild.roles.cache.get(current.roleId);
  if (!role || !role.editable) return false;

  const has = member.roles.cache.has(role.id);
  const wears = wearsTag(member.user, member.guild.id);
  if (wears && !has) {
    await member.roles.add(role, 'Tag role: member wears the server tag').catch(() => undefined);
    return true;
  }
  if (!wears && has) {
    await member.roles.remove(role, 'Tag role: member no longer wears the server tag').catch(() => undefined);
    return true;
  }
  return false;
}

export async function syncGuildTagRole(guild: Guild): Promise<void> {
  const config = await getTagRole(guild.id);
  if (!config.enabled || !config.roleId) return;
  if (guild.members.cache.size < guild.memberCount) await guild.members.fetch({ time: FETCH_TIMEOUT_MS }).catch(() => null);
  for (const member of guild.members.cache.values()) {
    const changed = await syncMemberTagRole(member, config).catch(() => false);
    if (changed) await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
  }
}
