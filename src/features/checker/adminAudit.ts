import type { Client } from 'discord.js';
import { permissionBit } from '../../core/permissions';
import { ensureLoggedIn, isConfigured } from './selfbot';

const ADMINISTRATOR_BIT = permissionBit('administrator');
const AVATAR_SIZE = 256;

export interface AdminEntry {
  id: string;
  displayName: string;
  avatarURL: string;
  isOwner: boolean;
  highestRoleName: string | null;
}

export interface GuildAdminAudit {
  id: string;
  name: string;
  iconURL: string | null;
  ownerId: string;
  ownerName: string | null;
  memberCount: number;
  admins: AdminEntry[];
}

export interface BotEntry {
  id: string;
  displayName: string;
  avatarURL: string;
  highestRoleName: string | null;
}

export interface GuildBotAudit {
  id: string;
  name: string;
  iconURL: string | null;
  ownerId: string;
  ownerName: string | null;
  memberCount: number;
  bots: BotEntry[];
}

interface MemberLike {
  id: string;
  displayName: string;
  permissions: { has(bit: bigint): boolean };
  roles: { highest: { id: string; name: string } };
  user: { bot: boolean; displayAvatarURL(options?: { size?: number }): string };
}

interface GuildLike {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  iconURL(options?: { size?: number }): string | null;
  members: {
    cache: { values(): Iterable<MemberLike> };
    fetch(): Promise<{ values(): Iterable<MemberLike> }>;
  };
}

function toEntry(member: MemberLike, isOwner: boolean, everyoneRoleId: string): AdminEntry {
  return {
    id: member.id,
    displayName: member.displayName,
    avatarURL: member.user.displayAvatarURL({ size: AVATAR_SIZE }),
    isOwner,
    highestRoleName: member.roles.highest.id === everyoneRoleId ? null : member.roles.highest.name,
  };
}

async function auditGuild(guild: GuildLike): Promise<GuildAdminAudit> {
  const fetched = await guild.members.fetch();
  // A fetch can be partial (for example, selfbot member-safety results). Keep
  // already-known members too, while deduplicating members present in both.
  const members = new Map<string, MemberLike>();
  for (const member of [...guild.members.cache.values(), ...fetched.values()]) {
    members.set(member.id, member);
  }
  const admins: AdminEntry[] = [];
  for (const member of members.values()) {
    if (member.user.bot) continue;
    const isOwner = member.id === guild.ownerId;
    if (isOwner || member.permissions.has(ADMINISTRATOR_BIT)) admins.push(toEntry(member, isOwner, guild.id));
  }
  admins.sort((a, b) => Number(b.isOwner) - Number(a.isOwner));

  return {
    id: guild.id,
    name: guild.name,
    iconURL: guild.iconURL({ size: AVATAR_SIZE }),
    ownerId: guild.ownerId,
    ownerName: admins.find((admin) => admin.isOwner)?.displayName ?? null,
    memberCount: guild.memberCount,
    admins,
  };
}

async function auditGuildBots(guild: GuildLike): Promise<GuildBotAudit> {
  const fetched = await guild.members.fetch();
  const bots: BotEntry[] = [];
  for (const member of fetched.values()) {
    if (!member.user.bot) continue;
    bots.push({
      id: member.id,
      displayName: member.displayName,
      avatarURL: member.user.displayAvatarURL({ size: AVATAR_SIZE }),
      highestRoleName: member.roles.highest.id === guild.id ? null : member.roles.highest.name,
    });
  }
  bots.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    id: guild.id,
    name: guild.name,
    iconURL: guild.iconURL({ size: AVATAR_SIZE }),
    ownerId: guild.ownerId,
    ownerName: null,
    memberCount: guild.memberCount,
    bots,
  };
}

export async function findGuildAdmins(client: Client, guildId: string): Promise<GuildAdminAudit | null> {
  const botGuild = client.guilds.cache.get(guildId);
  const self = isConfigured() ? await ensureLoggedIn().catch(() => null) : null;
  const selfGuild = self?.guilds.cache.get(guildId);

  const [botAudit, selfAudit] = await Promise.all([
    botGuild ? auditGuild(botGuild).catch(() => null) : Promise.resolve(null),
    selfGuild ? auditGuild(selfGuild).catch(() => null) : Promise.resolve(null),
  ]);
  if (!botAudit) return selfAudit;
  if (!selfAudit) return botAudit;

  const admins = new Map<string, AdminEntry>();
  for (const admin of [...botAudit.admins, ...selfAudit.admins]) {
    const existing = admins.get(admin.id);
    if (!existing || admin.isOwner) admins.set(admin.id, admin);
  }

  return {
    ...botAudit,
    memberCount: Math.max(botAudit.memberCount, selfAudit.memberCount),
    admins: [...admins.values()].sort((a, b) => Number(b.isOwner) - Number(a.isOwner)),
    ownerName: botAudit.ownerName ?? selfAudit.ownerName,
  };
}

export async function findGuildBots(client: Client, guildId: string): Promise<GuildBotAudit | null> {
  const botGuild = client.guilds.cache.get(guildId);
  if (botGuild) return auditGuildBots(botGuild);

  if (!isConfigured()) return null;
  const self = await ensureLoggedIn().catch(() => null);
  const selfGuild = self?.guilds.cache.get(guildId);
  return selfGuild ? auditGuildBots(selfGuild) : null;
}
