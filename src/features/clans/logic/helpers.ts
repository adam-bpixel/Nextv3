import { PermissionFlagsBits, type Guild, type GuildMember } from 'discord.js';
import config from '../../../core/config';
import { fail } from '../../../core/replies';
import type { CommandHandler } from '../../../core/types';
import { errorReply } from '../../../core/usage-replies';
import { cachedColor } from '../../theme/theme.model';
import { clanOf, getClan, settingsOf, type Clan } from '../clans.model';

export const USER_ID = /<@!?(\d{15,22})>|(\d{15,22})/;
export const duration = (ms: number): string => `${(ms / 3_600_000).toFixed(1)}h`;

export function isManager(member: GuildMember, roleIds: string[]): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator) || roleIds.some((id) => member.roles.cache.has(id));
}

export async function manager(ctx: Parameters<CommandHandler>[0], guildId: string): Promise<boolean> {
  const settings = await settingsOf(guildId);
  if (ctx.member && isManager(ctx.member, settings.managerRoleIds)) return true;
  await ctx.send(errorReply(ctx, 'You need a configured clan manager role or Administrator permission.'));
  return false;
}

export function accentOf(ctx: Parameters<CommandHandler>[0]): number {
  return (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
}

export async function logClan(guild: Guild, content: string): Promise<void> {
  const settings = await settingsOf(guild.id);
  if (!settings.logChannelId) return;
  const channel = await guild.channels.fetch(settings.logChannelId).catch(() => null);
  if (channel?.isTextBased() && channel.isSendable()) await channel.send({ content, allowedMentions: { parse: [] } }).catch(() => undefined);
}

export async function memberArg(ctx: Parameters<CommandHandler>[0]): Promise<GuildMember | null> {
  const raw = ctx.args[0] ?? '';
  const id = USER_ID.exec(raw)?.[1] ?? USER_ID.exec(raw)?.[2];
  if (id) {
    if (!ctx.guild) return null;
    return ctx.guild.members.cache.get(id) ?? (await ctx.guild.members.fetch(id).catch(() => null));
  }
  const name = raw.replace(/^@/, '').trim().toLowerCase();
  if (!name || !ctx.guild) return null;
  const matches = await ctx.guild.members.fetch({ query: name, limit: 5 }).catch(() => null);
  if (!matches) return null;
  return (
    matches.find((member) => member.user.username.toLowerCase() === name || member.displayName.toLowerCase() === name) ??
    matches.first() ??
    null
  );
}

export async function managedClan(ctx: Parameters<CommandHandler>[0], guildId: string): Promise<Clan | null> {
  const clanId = ctx.args[0];
  const clan = clanId ? (await getClan(guildId, clanId)) ?? await clanOf(guildId, ctx.user.id) : await clanOf(guildId, ctx.user.id);
  if (!clan) { await fail(ctx, `Clan not found. Use: \`${ctx.prefix}claninfo <clan ID>\`.`); return null; }
  return clan;
}

export async function assignRank(member: GuildMember, clan: Clan, rank: 'leader' | 'co-leader' | 'member' | null): Promise<void> {
  if (clan.roleId && member.guild.roles.cache.has(clan.roleId)) {
    if (rank) await member.roles.add(clan.roleId).catch(() => undefined);
    else await member.roles.remove(clan.roleId).catch(() => undefined);
  }
  const settings = await settingsOf(member.guild.id);
  for (const roleId of [settings.leaderRoleId, settings.coLeaderRoleId]) {
    if (!roleId || !member.guild.roles.cache.has(roleId)) continue;
    const shouldHave = (rank === 'leader' && roleId === settings.leaderRoleId) || (rank === 'co-leader' && roleId === settings.coLeaderRoleId);
    if (shouldHave) await member.roles.add(roleId).catch(() => undefined);
    else await member.roles.remove(roleId).catch(() => undefined);
  }
  const tag = clan.tag?.trim();
  if (tag) {
    const current = member.nickname ?? member.user.username;
    let untagged = current.trim();
    if (untagged.startsWith(`[${tag}]`)) untagged = untagged.slice(tag.length + 2).trim();
    if (untagged.endsWith(`[${tag}]`)) untagged = untagged.slice(0, -(tag.length + 2)).trim();
    const next = rank ? (clan.tagPosition === 'suffix' ? `${untagged} [${tag}]` : `[${tag}] ${untagged}`).slice(0, 32) : untagged.slice(0, 32);
    if (next !== current) await member.setNickname(next).catch(() => undefined);
  }
}
