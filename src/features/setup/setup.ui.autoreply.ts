import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { AUTOREPLY_ADD_ICON, AUTOREPLY_REMOVE_ICON } from '../../core/emojis';
import { MAX_AUTO_REPLIES, type AutoReplyEntry } from './setup.model';
import { parsedEmoji, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_AUTOREPLY_BUTTON = 'setup:autoreply:view:';
export const SETUP_AUTOREPLY_ADD_BUTTON = 'setup:autoreply:add';
export const SETUP_AUTOREPLY_REMOVE_BUTTON = 'setup:autoreply:remove';
export const SETUP_AUTOREPLY_ADD_MODAL = 'setup:autoreply:modal:add';
export const SETUP_AUTOREPLY_REMOVE_MODAL = 'setup:autoreply:modal:remove';

function autoReplyLine(entry: AutoReplyEntry): string {
  const matchLabel = entry.matchType === 'exact' ? 'Exact Match' : 'Anywhere in Text';
  return `- \`${entry.trigger}\` → \`${entry.response}\` \`${matchLabel}\``;
}

export function autoReplyView(entries: readonly AutoReplyEntry[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Auto Reply'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`**${entries.length}/${MAX_AUTO_REPLIES}**`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(entries.length ? entries.map(autoReplyLine).join('\n') : '- No auto-replies yet. Use **Add** to create one.'),
    );
  const addEmoji = parsedEmoji(AUTOREPLY_ADD_ICON);
  const removeEmoji = parsedEmoji(AUTOREPLY_REMOVE_ICON);
  const addButton = new ButtonBuilder().setCustomId(SETUP_AUTOREPLY_ADD_BUTTON).setLabel('Add').setStyle(ButtonStyle.Secondary).setDisabled(entries.length >= MAX_AUTO_REPLIES);
  const removeButton = new ButtonBuilder().setCustomId(SETUP_AUTOREPLY_REMOVE_BUTTON).setLabel('Remove').setStyle(ButtonStyle.Secondary).setDisabled(entries.length === 0);
  if (addEmoji) addButton.setEmoji(addEmoji);
  if (removeEmoji) removeButton.setEmoji(removeEmoji);
  container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(addButton, removeButton));
  return toPayload(container);
}

export function buildAutoReplyAddModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_AUTOREPLY_ADD_MODAL)
    .setTitle('Add Auto Reply')
    .addLabelComponents(
      new LabelBuilder().setLabel('Trigger').setDescription('The word or phrase that triggers the reply').setTextInputComponent((input) =>
        input.setCustomId('trigger').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setPlaceholder('e.g. hello'),
      ),
      new LabelBuilder().setLabel('Response').setDescription('What the bot replies with').setTextInputComponent((input) =>
        input.setCustomId('response').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true).setPlaceholder('e.g. Hello there!'),
      ),
      new LabelBuilder().setLabel('Match Type').setDescription('When should this trigger fire?').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('match_type')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Exact Match').setValue('exact').setDescription('Only when the message is exactly this word').setDefault(true),
            new StringSelectMenuOptionBuilder().setLabel('Anywhere in Text').setValue('contains').setDescription('When this word appears anywhere in the message'),
          ),
      ),
    );
}

export function buildAutoReplyRemoveModal(entries: readonly AutoReplyEntry[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_AUTOREPLY_REMOVE_MODAL)
    .setTitle('Remove Auto Reply')
    .addLabelComponents(
      new LabelBuilder().setLabel('Trigger').setStringSelectMenuComponent((select) => {
        select.setCustomId('entry').setMinValues(1).setMaxValues(1);
        for (const entry of entries) {
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(entry.trigger.slice(0, 100))
              .setValue(entry.id)
              .setDescription(entry.response.slice(0, 100)),
          );
        }
        return select;
      }),
    );
}
