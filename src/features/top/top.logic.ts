import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
  type Guild,
} from 'discord.js';
import config from '../../core/config';
import type { Ctx } from '../../core/context';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { cachedColor } from '../theme/theme.model';
import { clanOf, listClans, type Clan } from '../clans/clans.model';
import { richest, richestFull } from '../economy/wallet.model';
import { topInviters } from '../invites/invites.model';
import { topCombinedInGuild, topInGuild, type LevelKind } from '../levels/levels.model';
import { topVerifiers } from '../verification/verification.model';
import { renderTopImage, type TopEntry } from './topCanvas';
import { topListEmbed } from './topList.ui';

const LIMIT = 10;
const FULL = Number.MAX_SAFE_INTEGER;
export const TOP_SUBS = ['clans', 'members', 'invites', 'verif', 'chat', 'voice', 'xp', 'coins'] as const;
export type TopSub = (typeof TOP_SUBS)[number];

const duration = (ms: number): string => `${(ms / 3_600_000).toFixed(1)}h`;

export const TITLES: Record<string, string> = {
  clans: 'Top Clans Voice Activity',
  verif: 'Top 10 Verificators',
  chat: 'Top 10 Chat Activity',
  voice: 'Top 10 Voice Activity',
  xp: 'Top 10 Overall XP',
  members: 'Top Clan Members Voice Activity',
  invites: 'Top 10 Inviters',
  coins: 'Top 10 Richest',
};

const SUBCOMMAND_LINES = [
  ['clans', 'Top clans in this server by voice activity.'],
  ['members', 'Top members of your own clan by voice activity.'],
  ['invites', 'Top inviters in this server.'],
  ['verif', 'Top verificators in this server.'],
  ['chat', 'Top chat activity in this server.'],
  ['voice', 'Top voice activity in this server.'],
  ['xp', 'Top overall XP (chat + voice) in this server.'],
  ['coins', 'Richest members overall.'],
] as const;

function usagePayload(ctx: Ctx) {
  const accent = (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
  const body = [
    `Use: \`${ctx.prefix}top <clans|members|invites|verif|chat|voice|xp|coins>\`.`,
    ...SUBCOMMAND_LINES.map(([name, description]) => `- -# \`${name}\` — ${description}`),
  ].join('\n');
  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Invalid Usage'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] as [] } };
}

export async function clanEntries(guild: Guild): Promise<TopEntry[]> {
  const clans = await listClans(guild.id);
  return clans
    .map((clan) => ({
      id: clan.id,
      name: clan.name,
      memberCount: clan.memberIds.length + clan.coLeaderIds.length + 1,
      totalMs: Object.values(clan.hoursMs).reduce((a, b) => a + b, 0),
      iconURL: clan.avatarUrl ?? (clan.roleId ? guild.roles.cache.get(clan.roleId)?.iconURL({ size: 128 }) ?? null : null),
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .map((clan) => ({
      id: clan.id,
      name: clan.name,
      iconURL: clan.iconURL,
      metaText: `\u{1F465} ${clan.memberCount.toLocaleString()} Members`,
      scoreText: duration(clan.totalMs),
      scoreLabel: 'VOICE HOURS',
      fields: [
        { label: 'Total Voice', value: duration(clan.totalMs) },
        { label: 'Members', value: clan.memberCount.toLocaleString() },
        { label: 'Average', value: duration(clan.totalMs / clan.memberCount) },
        { label: 'Clan ID', value: clan.id },
      ],
    }));
}

async function verifEntries(guild: Guild): Promise<TopEntry[]> {
  const top = await topVerifiers(guild.id, LIMIT);
  const members = await Promise.all(top.map((entry) => guild.members.fetch(entry.verifierId).catch(() => null)));
  return top.map((entry, index) => {
    const member = members[index];
    return {
      id: entry.verifierId,
      name: member?.displayName ?? member?.user.username ?? 'Unknown',
      iconURL: member?.displayAvatarURL({ size: 128 }) ?? null,
      metaText: 'Verificator',
      scoreText: entry.count.toLocaleString(),
      scoreLabel: 'VERIFIED',
    };
  });
}

async function levelEntries(guild: Guild, kind: LevelKind): Promise<TopEntry[]> {
  const top = await topInGuild(guild.id, kind, LIMIT);
  const members = await Promise.all(top.map((entry) => guild.members.fetch(entry.userId).catch(() => null)));
  return top.map((entry, index) => {
    const member = members[index];
    return {
      id: entry.userId,
      name: member?.displayName ?? member?.user.username ?? 'Unknown',
      iconURL: member?.displayAvatarURL({ size: 128 }) ?? null,
      metaText: `${entry.progress.xp.toLocaleString()} XP`,
      scoreText: String(entry.progress.level),
      scoreLabel: 'LEVEL',
    };
  });
}

export async function clanMemberEntries(guild: Guild, clan: Clan): Promise<TopEntry[]> {
  const ids = [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds];
  const members = await Promise.all(ids.map((id) => guild.members.fetch(id).catch(() => null)));
  return ids
    .map((id, index) => ({ id, member: members.at(index) ?? null, ms: clan.hoursMs[id] ?? 0 }))
    .sort((a, b) => b.ms - a.ms)
    .map(({ id, member, ms }) => {
      const role = id === clan.leaderId ? 'Leader' : clan.coLeaderIds.includes(id) ? 'Co-Leader' : 'Member';
      return {
        id,
        name: member?.displayName ?? member?.user.username ?? 'Unknown',
        iconURL: member?.displayAvatarURL({ size: 128 }) ?? null,
        metaText: role,
        scoreText: duration(ms),
        scoreLabel: 'VOICE HOURS',
        fields: [{ label: 'Voice', value: duration(ms) }],
      };
    });
}

async function inviteEntries(guild: Guild): Promise<TopEntry[]> {
  const top = await topInviters(guild.id, LIMIT);
  const members = await Promise.all(top.map((entry) => guild.members.fetch(entry.userId).catch(() => null)));
  return top.map((entry, index) => {
    const member = members[index];
    return {
      id: entry.userId,
      name: member?.displayName ?? member?.user.username ?? 'Unknown',
      iconURL: member?.displayAvatarURL({ size: 128 }) ?? null,
      metaText: `${entry.leaves.toLocaleString()} left`,
      scoreText: entry.total.toLocaleString(),
      scoreLabel: 'INVITES',
    };
  });
}

async function xpEntries(guild: Guild): Promise<TopEntry[]> {
  const top = await topCombinedInGuild(guild.id, LIMIT);
  const members = await Promise.all(top.map((entry) => guild.members.fetch(entry.userId).catch(() => null)));
  return top.map((entry, index) => {
    const member = members[index];
    return {
      id: entry.userId,
      name: member?.displayName ?? member?.user.username ?? 'Unknown',
      iconURL: member?.displayAvatarURL({ size: 128 }) ?? null,
      metaText: `Chat Lv.${entry.chatLevel} • Voice Lv.${entry.voiceLevel}`,
      scoreText: entry.totalXp.toLocaleString(),
      scoreLabel: 'TOTAL XP',
    };
  });
}

async function coinEntries(ctx: Ctx): Promise<TopEntry[]> {
  const top = await richest(LIMIT);
  const users = await Promise.all(top.map((entry) => ctx.client.users.fetch(entry.userId).catch(() => null)));
  return top.map((entry, index) => {
    const user = users[index];
    return {
      id: entry.userId,
      name: user?.username ?? 'Unknown',
      iconURL: user?.displayAvatarURL({ size: 128 }) ?? null,
      metaText: 'Richest',
      scoreText: entry.wallet.total.toLocaleString(),
      scoreLabel: 'COINS',
    };
  });
}

export function topMeCustomId(sub: TopSub, invokerId: string): string {
  return `top:me:${sub}:${invokerId}`;
}

export function topMeButtonRow(sub: TopSub, invokerId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(topMeCustomId(sub, invokerId))
      .setLabel(sub === 'clans' ? 'My Clan' : 'Me')
      .setStyle(ButtonStyle.Secondary),
  );
}

export interface MyTopRank extends TopEntry {
  rank: number;
  total: number;
}

async function selfEntry(guild: Guild, userId: string): Promise<{ name: string; iconURL: string | null }> {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (member) return { name: member.displayName, iconURL: member.displayAvatarURL({ size: 128 }) };
  const user = await guild.client.users.fetch(userId).catch(() => null);
  return { name: user?.username ?? 'You', iconURL: user?.displayAvatarURL({ size: 128 }) ?? null };
}


export async function myTopRank(guild: Guild, sub: TopSub, userId: string): Promise<MyTopRank | null> {
  if (sub === 'clans') {
    const clan = await clanOf(guild.id, userId);
    if (!clan) return null;
    const ranked = (await listClans(guild.id))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        memberCount: entry.memberIds.length + entry.coLeaderIds.length + 1,
        totalMs: Object.values(entry.hoursMs).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.totalMs - a.totalMs);
    const index = ranked.findIndex((entry) => entry.id === clan.id);
    const found = ranked.at(index);
    if (index === -1 || !found) return null;
    return {
      id: clan.id,
      name: found.name,
      iconURL: null,
      rank: index + 1,
      total: ranked.length,
      scoreLabel: 'VOICE HOURS',
      scoreText: duration(found.totalMs),
      metaText: `\u{1F465} ${found.memberCount.toLocaleString()} Members`,
    };
  }

  if (sub === 'members') {
    const clan = await clanOf(guild.id, userId);
    if (!clan) return null;
    const ranked = [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]
      .map((id) => ({ id, ms: clan.hoursMs[id] ?? 0 }))
      .sort((a, b) => b.ms - a.ms);
    const index = ranked.findIndex((entry) => entry.id === userId);
    const found = ranked.at(index);
    if (index === -1 || !found) return null;
    const self = await selfEntry(guild, userId);
    return {
      id: userId,
      ...self,
      rank: index + 1,
      total: ranked.length,
      scoreLabel: 'VOICE HOURS',
      scoreText: duration(found.ms),
      metaText: userId === clan.leaderId ? 'Leader' : clan.coLeaderIds.includes(userId) ? 'Co-Leader' : 'Member',
    };
  }

  if (sub === 'invites') {
    const list = await topInviters(guild.id, FULL);
    const index = list.findIndex((entry) => entry.userId === userId);
    const found = list.at(index);
    if (index === -1 || !found) return null;
    const self = await selfEntry(guild, userId);
    return { id: userId, ...self, rank: index + 1, total: list.length, scoreLabel: 'INVITES', scoreText: found.total.toLocaleString(), metaText: `${found.leaves.toLocaleString()} left` };
  }

  if (sub === 'verif') {
    const list = await topVerifiers(guild.id, FULL);
    const index = list.findIndex((entry) => entry.verifierId === userId);
    const found = list.at(index);
    if (index === -1 || !found) return null;
    const self = await selfEntry(guild, userId);
    return { id: userId, ...self, rank: index + 1, total: list.length, scoreLabel: 'VERIFIED', scoreText: found.count.toLocaleString(), metaText: 'Verificator' };
  }

  if (sub === 'xp') {
    const list = await topCombinedInGuild(guild.id, FULL);
    const index = list.findIndex((entry) => entry.userId === userId);
    const found = list.at(index);
    if (index === -1 || !found) return null;
    const self = await selfEntry(guild, userId);
    return {
      id: userId,
      ...self,
      rank: index + 1,
      total: list.length,
      scoreLabel: 'TOTAL XP',
      scoreText: found.totalXp.toLocaleString(),
      metaText: `Chat Lv.${found.chatLevel} • Voice Lv.${found.voiceLevel}`,
    };
  }

  if (sub === 'coins') {
    const list = await richestFull();
    const index = list.findIndex((entry) => entry.userId === userId);
    const found = list.at(index);
    if (index === -1 || !found) return null;
    const self = await selfEntry(guild, userId);
    return { id: userId, ...self, rank: index + 1, total: list.length, scoreLabel: 'COINS', scoreText: found.wallet.total.toLocaleString(), metaText: 'Richest' };
  }

  const list = await topInGuild(guild.id, sub, FULL);
  const index = list.findIndex((entry) => entry.userId === userId);
  const found = list.at(index);
  if (index === -1 || !found) return null;
  const self = await selfEntry(guild, userId);
  return {
    id: userId,
    ...self,
    rank: index + 1,
    total: list.length,
    scoreLabel: 'LEVEL',
    scoreText: String(found.progress.level),
    metaText: `${found.progress.xp.toLocaleString()} XP`,
  };
}

export const topLogic = {
  async top(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const sub = (ctx.args[0] ?? '').toLowerCase();
    const fallbackTitle = TITLES[sub];
    if (!fallbackTitle) {
      await ctx.send(usagePayload(ctx));
      return 'skipped';
    }

    let title = fallbackTitle;
    let entries: TopEntry[];

    if (sub === 'members') {
      const clan = await clanOf(guild.id, ctx.user.id);
      if (!clan) return fail(ctx, 'You are not in a clan.');
      title = clan.name;
      entries = await clanMemberEntries(guild, clan);
    } else {
      entries = await (sub === 'clans' ? clanEntries(guild)
        : sub === 'invites' ? inviteEntries(guild)
        : sub === 'verif' ? verifEntries(guild)
        : sub === 'xp' ? xpEntries(guild)
        : sub === 'coins' ? coinEntries(ctx)
        : levelEntries(guild, sub as LevelKind));
    }

    if (!entries.length) return fail(ctx, 'There is nothing to rank yet.');

    const accent = cachedColor(guild.id) ?? config.color;

    if (sub === 'clans' || sub === 'members') {
      await ctx.send(topListEmbed(accent, title, entries, 0, sub, ctx.user.id));
      return 'completed';
    }

    const fileName = 'top.png';
    const buffer = await renderTopImage(title, entries);
    const container = new ContainerBuilder()
      .setAccentColor(accent)
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)))
      .addSeparatorComponents(new SeparatorBuilder())
      .addActionRowComponents(topMeButtonRow(sub as TopSub, ctx.user.id));
    await ctx.send({
      components: [container.toJSON()],
      flags: MessageFlags.IsComponentsV2,
      files: [{ attachment: buffer, name: fileName }],
      allowedMentions: { parse: [] },
    });
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
