import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
  type APIMessageTopLevelComponent,
} from 'discord.js';
import config from '../../core/config';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD } from '../../core/emojis';

export const ROLES_PER_PAGE = 10;

export interface InfoPage {
  components: APIMessageTopLevelComponent[];
  flags: number;
  allowedMentions: { parse: [] };
}

function text(content: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(content);
}

export function rolesNavCustomId(invokerId: string, page: number): string {
  return `info:roles:${invokerId}:${page}`;
}

function rolesNavRow(invokerId: string, page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(rolesNavCustomId(invokerId, page - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
    new ButtonBuilder().setCustomId(rolesNavCustomId(invokerId, page)).setLabel(`${page + 1} / ${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
    new ButtonBuilder()
      .setCustomId(rolesNavCustomId(invokerId, page + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

export function rolesPage(guildName: string, roleLines: readonly string[], totalRoles: number, page: number, invokerId: string): InfoPage {
  const totalPages = Math.max(1, Math.ceil(roleLines.length / ROLES_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * ROLES_PER_PAGE;
  const shown = roleLines.slice(start, start + ROLES_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${guildName} — Roles (${totalRoles})`))
    .addTextDisplayComponents(text(shown.join('\n') || 'None'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(rolesNavRow(invokerId, safePage, totalPages));

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
