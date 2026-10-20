import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder } from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, numberEmoji } from '../../core/emojis';

export const SERVERS_LIST_PER_PAGE = 5;
const DEFAULT_ICON = 'https://cdn.discordapp.com/embed/avatars/0.png';

export interface ServerListEntry {
  id: string;
  name: string;
  iconURL: string | null;
  memberCount: number;
  ownerId: string;
}

export function serversListCustomId(invokerId: string, page: number): string {
  return `owner:servers:${invokerId}:${page}`;
}

function serverSection(rank: number, server: ServerListEntry): SectionBuilder {
  const lines = [
    `${numberEmoji(rank)} **${server.name}**`,
    `> **Members:** \`${server.memberCount.toLocaleString()}\``,
    `> **Owner:** <@${server.ownerId}>`,
    `> **Server ID:** \`${server.id}\``,
  ].join('\n');
  return new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(lines)).setThumbnailAccessory(new ThumbnailBuilder().setURL(server.iconURL ?? DEFAULT_ICON));
}

export function serversListCard(accentColor: number, entries: readonly ServerListEntry[], page: number, invokerId: string): ReplyPayload {
  const totalMembers = entries.reduce((sum, server) => sum + server.memberCount, 0);
  const totalPages = Math.max(1, Math.ceil(entries.length / SERVERS_LIST_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * SERVERS_LIST_PER_PAGE;
  const shown = entries.slice(start, start + SERVERS_LIST_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Servers · ${entries.length.toLocaleString()} · ${totalMembers.toLocaleString()} members`))
    .addSeparatorComponents(new SeparatorBuilder());

  if (!shown.length) container.addTextDisplayComponents(new TextDisplayBuilder().setContent('*I am not in any servers.*'));
  else shown.forEach((server, index) => container.addSectionComponents(serverSection(start + index + 1, server)));

  container.addSeparatorComponents(new SeparatorBuilder());
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(serversListCustomId(invokerId, safePage - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 0),
      new ButtonBuilder().setCustomId('owner:servers:noop').setLabel(`${safePage + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(serversListCustomId(invokerId, safePage + 1)).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages - 1),
    ),
  );

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
