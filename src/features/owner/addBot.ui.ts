import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  TextInputStyle,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';

export const ADD_BOT_BUTTON = 'owner:addbot:open';
export const ADD_BOT_MODAL = 'owner:addbot:modal';

export function addBotPanel(): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Add Bot'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Click below to add a bot token to the fleet. The token is entered in a private form so it never appears in chat.'),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(ADD_BOT_BUTTON).setLabel('Add Bot').setStyle(ButtonStyle.Secondary),
      ),
    );
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2 };
}

export function buildAddBotModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(ADD_BOT_MODAL)
    .setTitle('Add Bot')
    .addLabelComponents(
      new LabelBuilder().setLabel('Bot Token').setDescription('The bot token from the Discord Developer Portal.').setTextInputComponent((input) =>
        input.setCustomId('token').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setPlaceholder('Paste the token here'),
      ),
      new LabelBuilder().setLabel('Name').setDescription('Optional label to recognize this bot by.').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(32).setRequired(false).setPlaceholder('Optional'),
      ),
    );
}
