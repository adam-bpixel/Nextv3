import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder, type Client } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, numberEmoji } from '../../core/emojis';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { findSelfbotGuild, isConfigured } from './selfbot';
import type { ButtonInteraction } from 'discord.js';

export const OLD_MEMBERS_LIMIT = 100;
export const OLD_MEMBERS_PER_PAGE = 10;
const FETCH_TIMEOUT_MS = 90_000;
export const OLD_MEMBERS_NAV_ID = /^checker:om:(old|new):(\d{15,22}):(\d{15,22}):(-?\d+)$/;

export type MemberOrder = 'old' | 'new';

export interface OldMemberEntry {
  id: string;
  name: string;
  joinedAt: number;
}

export interface OldMembersResult {
  order: MemberOrder;
  guildId: string;
  guildName: string;
  entries: OldMemberEntry[];
}

function sortedMembers(members: Iterable<{ id: string; displayName: string; joinedTimestamp: number | null; user: { bot: boolean } }>, order: MemberOrder): OldMemberEntry[] {
  return [...members]
    .filter((member) => !member.user.bot && member.joinedTimestamp !== null)
    .map((member) => ({ id: member.id, name: member.displayName, joinedAt: member.joinedTimestamp ?? 0 }))
    .sort((a, b) => (order === 'old' ? a.joinedAt - b.joinedAt : b.joinedAt - a.joinedAt))
    .slice(0, OLD_MEMBERS_LIMIT);
}

async function fromBot(client: Client, guildId: string, order: MemberOrder): Promise<OldMembersResult | null> {
  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId).catch(() => null));
  if (!guild) return null;
  if (guild.members.cache.size < guild.memberCount) await guild.members.fetch({ time: FETCH_TIMEOUT_MS }).catch(() => null);
  return { order, guildId: guild.id, guildName: guild.name, entries: sortedMembers(guild.members.cache.values(), order) };
}

async function fromSelfbot(guildId: string, order: MemberOrder): Promise<OldMembersResult | null> {
  if (!isConfigured()) return null;
  const guild = await findSelfbotGuild(guildId).catch(() => null);
  if (!guild) return null;
  if (guild.members.cache.size < guild.memberCount) {
    const permissions = guild.members.me?.permissions;
    const canListAll = Boolean(permissions?.has('KICK_MEMBERS') || permissions?.has('BAN_MEMBERS') || permissions?.has('MANAGE_ROLES'));
    await (canListAll ? guild.members.fetch() : guild.members.fetchByMemberSafety(FETCH_TIMEOUT_MS)).catch(() => null);
  }
  return { order, guildId: guild.id, guildName: guild.name, entries: sortedMembers(guild.members.cache.values(), order) };
}

export async function findOldestMembers(client: Client, guildId: string, order: MemberOrder = 'old'): Promise<OldMembersResult | null> {
  return (await fromBot(client, guildId, order)) ?? (await fromSelfbot(guildId, order));
}

function profileName(name: string): string {
  return name.replace(/[[\]\\]/g, '').trim() || 'Unknown';
}

function navCustomId(order: MemberOrder, invokerId: string, guildId: string, page: number): string {
  return `checker:om:${order}:${invokerId}:${guildId}:${page}`;
}

export function oldMembersPage(result: OldMembersResult, page: number, invokerId: string, accent: number): ReplyPayload {
  const totalPages = Math.max(1, Math.ceil(result.entries.length / OLD_MEMBERS_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * OLD_MEMBERS_PER_PAGE;
  const shown = result.entries.slice(start, start + OLD_MEMBERS_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${result.order === 'old' ? 'Oldest' : 'Newest'} Members · ${result.guildName}`))
    .addSeparatorComponents(new SeparatorBuilder());

  if (!shown.length) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('No members were found in this server.'));
  } else {
    const lines = shown.map((entry, index) => `${numberEmoji(start + index + 1)} [${profileName(entry.name)}](https://discord.com/users/${entry.id}) \`${new Date(entry.joinedAt).toISOString().slice(0, 10)}\``);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
  }

  container.addSeparatorComponents(new SeparatorBuilder()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(navCustomId(result.order, invokerId, result.guildId, safePage - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 0),
      new ButtonBuilder().setCustomId('checker:om:noop').setLabel(`${safePage + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(navCustomId(result.order, invokerId, result.guildId, safePage + 1)).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages - 1),
    ),
  );
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export const oldMembersRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'checker:oldmembers',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && OLD_MEMBERS_NAV_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = OLD_MEMBERS_NAV_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, order, invokerId, guildId, pageText] = parsed as unknown as [string, MemberOrder, string, string, string];
      if (interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use these buttons.`));
        return;
      }
      const result = await findOldestMembers(interaction.client, guildId, order);
      if (!result) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't find that server anymore."));
        return;
      }
      await interaction.update(oldMembersPage(result, Number(pageText), invokerId, (interaction.guildId ? cachedColor(interaction.guildId) : undefined) ?? config.color));
    },
  }),
];
