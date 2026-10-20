import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_PREFIX_BUTTON = 'setup:prefix:view:';
export const SETUP_PREFIX_SERVER_BUTTON = 'setup:prefix:server:open';
export const SETUP_PREFIX_SELF_BUTTON = 'setup:prefix:self:open';
export const SETUP_PREFIX_SERVER_MODAL = 'setup:prefix:modal:server';
export const SETUP_PREFIX_SELF_MODAL = 'setup:prefix:modal:self';

export function prefixView(guildPrefix: string, selfPrefix: string | null, canUseSelf: boolean): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Prefix'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text([
        `- -# **__Server Prefix__** · \`${guildPrefix}\``,
        `- -# **__Your Personal Prefix__** · ${selfPrefix ? `\`${selfPrefix}\`` : 'Not set'}${canUseSelf ? '' : ' (Premium only)'}`,
      ].join('\n')),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_PREFIX_SERVER_BUTTON).setLabel('Server').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_PREFIX_SELF_BUTTON).setLabel('Self').setStyle(ButtonStyle.Secondary).setDisabled(!canUseSelf),
    ),
  );
  return toPayload(container);
}

export function buildPrefixServerModal(currentPrefix: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_PREFIX_SERVER_MODAL)
    .setTitle('Server Prefix')
    .addLabelComponents(
      new LabelBuilder().setLabel('Prefix').setDescription('1-10 characters, no spaces. Type "reset" to restore the default.').setTextInputComponent((input) =>
        input.setCustomId('prefix').setStyle(TextInputStyle.Short).setMaxLength(10).setRequired(true).setPlaceholder(`current: ${currentPrefix}`),
      ),
    );
}

export function buildPrefixSelfModal(currentPrefix: string | null): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_PREFIX_SELF_MODAL)
    .setTitle('Your Personal Prefix')
    .addLabelComponents(
      new LabelBuilder().setLabel('Prefix').setDescription('1-10 characters, no spaces. Type "reset" to remove it.').setTextInputComponent((input) =>
        input.setCustomId('prefix').setStyle(TextInputStyle.Short).setMaxLength(10).setRequired(true).setPlaceholder(currentPrefix ? `current: ${currentPrefix}` : 'e.g. !'),
      ),
    );
}
