import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { formatDuration } from '../../core/format';
import type { AltTrackerSettings } from '../security/security.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_ALTTRACKER_BUTTON = 'setup:alttracker:view:';
export const SETUP_ALTTRACKER_CONFIGURE_BUTTON = 'setup:alttracker:configure';
export const SETUP_ALTTRACKER_TOGGLE_BUTTON = 'setup:alttracker:toggle';
export const SETUP_ALTTRACKER_CONFIGURE_MODAL = 'setup:alttracker:modal:configure';

export function altTrackerView(settings: AltTrackerSettings): ReplyPayload {
  const lines = [
    `- __**Status**__ ﹕ **${settings.enabled ? 'Enabled' : 'Disabled'}**`,
    `- __**Alert Channel**__ ﹕ ${settings.channelId ? `<#${settings.channelId}>` : '*Not set*'}`,
    `- __**Minimum Account Age**__ ﹕ \`${formatDuration(settings.minAccountAgeMs)}\``,
  ];

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Alt Tracker'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Flags new members whose Discord account is younger than the configured age'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines.join('\n')));

  const toggleButton = new ButtonBuilder()
    .setCustomId(SETUP_ALTTRACKER_TOGGLE_BUTTON)
    .setLabel(settings.enabled ? 'Disable' : 'Enable')
    .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
    .setDisabled(!settings.channelId);

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_ALTTRACKER_CONFIGURE_BUTTON).setLabel('Configure').setStyle(ButtonStyle.Secondary),
      toggleButton,
    ),
  );
  return toPayload(container);
}

export function buildAltTrackerConfigureModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_ALTTRACKER_CONFIGURE_MODAL)
    .setTitle('Alt Tracker Setup')
    .addLabelComponents(
      new LabelBuilder().setLabel('Alert Channel').setDescription('Where alt alerts are posted').setChannelSelectMenuComponent((select) =>
        select.setCustomId('channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
      new LabelBuilder()
        .setLabel('Minimum Account Age')
        .setDescription('Accounts younger than this are flagged - leave blank to keep the current value')
        .setTextInputComponent((input) =>
          input.setCustomId('min_age').setStyle(TextInputStyle.Short).setMaxLength(10).setRequired(false).setPlaceholder('e.g. 7d, 24h, 30m'),
        ),
    );
}
