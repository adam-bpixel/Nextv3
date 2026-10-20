import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder } from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, numberEmoji } from '../../core/emojis';
import type { TopEntry } from './topCanvas';

export const TOP_LIST_PER_PAGE = 5;
const DEFAULT_ICON = 'https://cdn.discordapp.com/embed/avatars/0.png';

export function topListCustomId(sub: string, invokerId: string, page: number): string {
  return `top:page:${sub}:${invokerId}:${page}`;
}

function entryContent(rank: number, entry: TopEntry, sub: string): string {
  const name = sub === 'members' ? `<@${entry.id}>` : `**${entry.name}**`;
  const fields = entry.fields ?? [{ label: entry.scoreLabel, value: entry.scoreText }];
  return fields.length === 1
    ? `${numberEmoji(rank)} ${name} \`${fields[0]!.value}\``
    : `${numberEmoji(rank)} ${name}\n${fields.map((field) => `> **${field.label}:** \`${field.value}\``).join('\n')}`;
}

function entrySection(rank: number, entry: TopEntry, sub: string): SectionBuilder {
  const text = new TextDisplayBuilder().setContent(entryContent(rank, entry, sub));
  return new SectionBuilder().addTextDisplayComponents(text).setThumbnailAccessory(new ThumbnailBuilder().setURL(entry.iconURL ?? DEFAULT_ICON));
}

export function topListEmbed(
  accent: number,
  title: string,
  entries: readonly TopEntry[],
  page: number,
  sub: string,
  invokerId: string,
): ReplyPayload {
  const totalPages = Math.max(1, Math.ceil(entries.length / TOP_LIST_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * TOP_LIST_PER_PAGE;
  const shown = entries.slice(start, start + TOP_LIST_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${title}`))
    .addSeparatorComponents(new SeparatorBuilder());

  if (!shown.length) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('There is nothing to rank yet.'));
  } else {
    shown.forEach((entry, index) => {
      const rank = start + index + 1;
      if (sub === 'members') {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(entryContent(rank, entry, sub)));
      } else {
        container.addSectionComponents(entrySection(rank, entry, sub));
      }
    });
  }

  container.addSeparatorComponents(new SeparatorBuilder());
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(topListCustomId(sub, invokerId, safePage - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 0),
    new ButtonBuilder().setCustomId(`top:page:noop`).setLabel(`${safePage + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(topListCustomId(sub, invokerId, safePage + 1)).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages - 1),
  );
  container.addActionRowComponents(navRow);

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
