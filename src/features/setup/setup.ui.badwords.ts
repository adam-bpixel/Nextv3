import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_BAD_WORDS, MAX_BAD_WORD_LENGTH } from '../badwords/badwords.model';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_BADWORDS_BUTTON = 'setup:badwords:view:';
export const SETUP_BADWORDS_ADD_BUTTON = 'setup:badwords:add';
export const SETUP_BADWORDS_REMOVE_BUTTON = 'setup:badwords:remove';
export const SETUP_BADWORDS_ADD_MODAL = 'setup:badwords:modal:add';
export const SETUP_BADWORDS_REMOVE_MODAL = 'setup:badwords:modal:remove';

const SELECT_PAGE_SIZE = 25;

export function badWordsView(words: readonly string[]): ReplyPayload {
  const list = words.length ? words.map((word) => `\`${word}\``).join(', ') : '- -# **__Words__** · None added yet - use **Add**';
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Bad Words'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`-# ${words.length}/${MAX_BAD_WORDS} words, up to ${MAX_BAD_WORD_LENGTH} characters each. Messages containing them are deleted`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(list))
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(SETUP_BADWORDS_ADD_BUTTON).setLabel('Add').setStyle(ButtonStyle.Secondary).setDisabled(words.length >= MAX_BAD_WORDS),
        new ButtonBuilder().setCustomId(SETUP_BADWORDS_REMOVE_BUTTON).setLabel('Remove').setStyle(ButtonStyle.Secondary).setDisabled(words.length === 0),
      ),
    );
  return toPayload(container);
}

export function buildBadWordsAddModal(remainingSlots: number): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_BADWORDS_ADD_MODAL)
    .setTitle('Add Bad Words')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Words')
        .setDescription(`Separate with commas or new lines - up to ${remainingSlots} more, ${MAX_BAD_WORD_LENGTH} characters each`)
        .setTextInputComponent((input) => input.setCustomId('words').setStyle(TextInputStyle.Paragraph).setMaxLength(1500).setRequired(true).setPlaceholder('word one, word two')),
    );
}

export function buildBadWordsRemoveModal(words: readonly string[]): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(SETUP_BADWORDS_REMOVE_MODAL).setTitle('Remove Bad Words');
  for (let start = 0, index = 0; start < words.length; start += SELECT_PAGE_SIZE, index++) {
    const group = words.slice(start, start + SELECT_PAGE_SIZE);
    modal.addLabelComponents(
      new LabelBuilder().setLabel(index === 0 ? 'Words' : 'More words').setStringSelectMenuComponent((select) => {
        select.setCustomId(`words${index}`).setPlaceholder('Choose words to remove').setMinValues(0).setMaxValues(group.length).setRequired(index === 0 && words.length <= SELECT_PAGE_SIZE);
        for (const word of group) select.addOptions(new StringSelectMenuOptionBuilder().setLabel(word.slice(0, 100)).setValue(word));
        return select;
      }),
    );
  }
  return modal;
}
