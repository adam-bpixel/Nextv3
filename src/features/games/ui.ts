import type { ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import config from '../../core/config';
import type { Ctx, ReplyPayload } from '../../core/context';
import { cachedColor } from '../theme/theme.model';

export function gameAccentColor(ctx: Ctx): number {
  return (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
}

export function gameCard(ctx: Ctx, content: string, actionRows: readonly ActionRowBuilder<ButtonBuilder>[] = []): ReplyPayload {
  const container = new ContainerBuilder().setAccentColor(gameAccentColor(ctx)).addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
  if (actionRows.length) {
    container.addSeparatorComponents(new SeparatorBuilder());
    for (const row of actionRows) container.addActionRowComponents(row);
  }
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2 };
}
