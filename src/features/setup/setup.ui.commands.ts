import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_DISABLED_COMMANDS } from '../server/server.model';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_COMMANDS_BUTTON = 'setup:commands:view:';
export const SETUP_COMMANDS_DISABLE_BUTTON = 'setup:commands:disable';
export const SETUP_COMMANDS_ENABLE_BUTTON = 'setup:commands:enable';
export const SETUP_COMMANDS_DISABLE_MODAL = 'setup:commands:modal:disable';
export const SETUP_COMMANDS_ENABLE_MODAL = 'setup:commands:modal:enable';

export function commandsView(disabled: readonly string[]): ReplyPayload {
  const list = disabled.length
    ? disabled.map((name, index) => `- -# **__${index + 1}__** · \`${name}\``).join('\n')
    : '- -# **__Commands__** · None disabled yet - use **Disable**';
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Disabled Commands'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`-# ${disabled.length}/${MAX_DISABLED_COMMANDS} commands disabled in this server`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(list))
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(SETUP_COMMANDS_DISABLE_BUTTON)
          .setLabel('Disable')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled.length >= MAX_DISABLED_COMMANDS),
        new ButtonBuilder().setCustomId(SETUP_COMMANDS_ENABLE_BUTTON).setLabel('Enable').setStyle(ButtonStyle.Secondary).setDisabled(disabled.length === 0),
      ),
    );
  return toPayload(container);
}

function namesModal(customId: string, title: string, description: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addLabelComponents(
      new LabelBuilder().setLabel('Command names').setDescription(description).setTextInputComponent((input) =>
        input.setCustomId('names').setStyle(TextInputStyle.Paragraph).setMaxLength(400).setRequired(true).setPlaceholder('avatar userinfo ban'),
      ),
    );
}

export function buildCommandsDisableModal(remainingSlots: number): ModalBuilder {
  return namesModal(SETUP_COMMANDS_DISABLE_MODAL, 'Disable Commands', `Separate names with spaces - up to ${remainingSlots} more`);
}

export function buildCommandsEnableModal(disabled: readonly string[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_COMMANDS_ENABLE_MODAL)
    .setTitle('Enable Commands')
    .addLabelComponents(
      new LabelBuilder().setLabel('Commands').setDescription('Choose one or more commands to enable').setStringSelectMenuComponent((select) => {
        select.setCustomId('names').setPlaceholder('Choose commands').setMinValues(1).setMaxValues(Math.max(1, disabled.length));
        for (const name of disabled) select.addOptions(new StringSelectMenuOptionBuilder().setLabel(name.slice(0, 100)).setValue(name));
        return select;
      }),
    );
}
