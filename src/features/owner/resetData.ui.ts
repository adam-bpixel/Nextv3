import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { resetDataLabel, type ResetDataTarget } from './serverData.model';

export const RESET_DATA_PREFIX = 'owner:resetdata';

export function resetDataCustomId(action: 'confirm' | 'cancel', target: ResetDataTarget, invokerId: string): string {
  return `${RESET_DATA_PREFIX}:${action}:${target}:${invokerId}`;
}

function buttons(disabled: boolean, target: ResetDataTarget, invokerId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(resetDataCustomId('confirm', target, invokerId)).setLabel('Confirm').setStyle(ButtonStyle.Danger).setDisabled(disabled),
    new ButtonBuilder().setCustomId(resetDataCustomId('cancel', target, invokerId)).setLabel('Cancel').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  );
}

export function resetDataPrompt(accent: number, guildName: string, target: ResetDataTarget, invokerId: string): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# ⚠️ Reset Data'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `This will permanently delete **${resetDataLabel(target)}** for **${guildName}**.\nThis cannot be undone. Are you sure?`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(buttons(false, target, invokerId));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export function resetDataResult(accent: number, target: ResetDataTarget, outcome: 'confirmed' | 'cancelled' | 'expired', cleared = 0): ReplyPayload {
  const title = outcome === 'confirmed' ? '# Data Reset' : outcome === 'cancelled' ? '# Cancelled' : '# Timed Out';
  const body = outcome === 'confirmed'
    ? `- Cleared **${cleared}** stored record(s) for **${resetDataLabel(target)}**.`
    : outcome === 'cancelled'
      ? '- No data was changed.'
      : '- No response in time. No data was changed.';
  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
