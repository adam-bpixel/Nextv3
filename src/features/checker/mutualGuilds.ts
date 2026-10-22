import type { Client } from 'discord.js';
import { isRecord } from '../../core/json';
import type { PermissionName } from '../../core/permissions';
import { dangerousPermissionsOf, type PermissionsLike } from './checker.service';
import { ensureLoggedIn, isConfigured } from './selfbot';

export interface MutualGuildEntry {
  id: string;
  name: string;
  iconURL: string | null;
  members: number;
  nickname: string | null;
  joinedAt: number | null;
  avatarURL: string;
  isOwner: boolean;
  isAdmin: boolean;
  topRole: string | null;
  topRoles: { id: string; name: string }[];
  dangerousRoles: { id: string; name: string }[];
  dangerous: PermissionName[];
}

interface MemberLike {
  id: string;
  nickname: string | null;
  joinedTimestamp: number | null;
  permissions: PermissionsLike;
  roles: { highest: { id: string; name: string }; cache: { values(): Iterable<{ id: string; name: string; position: number; permissions: PermissionsLike }> } };
  user: { displayAvatarURL(options?: { size?: number }): string };
}

interface GuildLike {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  iconURL(options?: { size?: number }): string | null;
  members: { fetch(id: string): Promise<MemberLike> };
}

const TOP_ROLES_COUNT = 6;

function toEntry(guild: GuildLike, member: MemberLike): MutualGuildEntry {
  const dangerous = dangerousPermissionsOf(member.permissions);
  const sortedRoles = [...member.roles.cache.values()].filter((role) => role.id !== guild.id).sort((a, b) => b.position - a.position);
  return {
    id: guild.id,
    name: guild.name,
    iconURL: guild.iconURL({ size: 256 }),
    members: guild.memberCount,
    nickname: member.nickname,
    joinedAt: member.joinedTimestamp === null ? null : Math.floor(member.joinedTimestamp / 1000),
    avatarURL: member.user.displayAvatarURL({ size: 256 }),
    isOwner: member.id === guild.ownerId,
    isAdmin: dangerous.includes('administrator'),
    topRole: member.roles.highest.id === guild.id ? null : member.roles.highest.name,
    dangerous,
    topRoles: sortedRoles.slice(0, TOP_ROLES_COUNT).map((role) => ({ id: role.id, name: role.name })),
    dangerousRoles: sortedRoles.filter((role) => dangerousPermissionsOf(role.permissions).length > 0).map((role) => ({ id: role.id, name: role.name })),
  };
}

async function fetchEntry(guild: GuildLike, userId: string): Promise<MutualGuildEntry | null> {
  const member = await guild.members.fetch(userId).catch(() => null);
  return member ? toEntry(guild, member) : null;
}

const FETCH_BATCH_SIZE = 40;

async function fetchEntriesBatched(guilds: readonly GuildLike[], userId: string): Promise<(MutualGuildEntry | null)[]> {
  const results: (MutualGuildEntry | null)[] = [];
  for (let i = 0; i < guilds.length; i += FETCH_BATCH_SIZE) {
    const batch = guilds.slice(i, i + FETCH_BATCH_SIZE);
    results.push(...(await Promise.all(batch.map((guild) => fetchEntry(guild, userId)))));
  }
  return results;
}

function mutualGuildIds(profile: unknown): string[] | null {
  if (!isRecord(profile) || !Array.isArray(profile.mutual_guilds)) return null;
  const ids: string[] = [];
  for (const entry of profile.mutual_guilds) {
    if (isRecord(entry) && typeof entry.id === 'string') ids.push(entry.id);
  }
  return ids;
}

async function selfbotCandidates(userId: string): Promise<GuildLike[]> {
  if (!isConfigured()) return [];
  return ensureLoggedIn()
    .then(async (self) => {
      const target = await self.users.fetch(userId);
      const profile: unknown = await target.getProfile();
      const ids = mutualGuildIds(profile);
      if (!ids) return [...self.guilds.cache.values()];
      const resolved: GuildLike[] = [];
      for (const id of ids) {
        const guild = self.guilds.cache.get(id);
        if (guild) resolved.push(guild);
      }
      return resolved;
    })
    .catch(() => []);
}

export async function getMutualGuilds(client: Client, userId: string): Promise<MutualGuildEntry[]> {
  const seen = new Set<string>();
  const entries: MutualGuildEntry[] = [];

  const botResults = await fetchEntriesBatched([...client.guilds.cache.values()], userId);
  for (const entry of botResults) {
    if (!entry) continue;
    seen.add(entry.id);
    entries.push(entry);
  }

  const candidates = (await selfbotCandidates(userId)).filter((guild) => !seen.has(guild.id));
  const selfResults = await fetchEntriesBatched(candidates, userId);
  for (const entry of selfResults) {
    if (!entry) continue;
    seen.add(entry.id);
    entries.push(entry);
  }

  return entries.sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || Number(b.isAdmin) - Number(a.isAdmin) || b.members - a.members);
}
