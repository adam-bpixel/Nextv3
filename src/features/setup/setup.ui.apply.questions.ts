import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_APPLY_QUESTIONS, type ApplyCategory } from './setup.model';
import { SETUP_APPLY_QUESTIONS_BACK_BUTTON, SETUP_APPLY_QUESTIONS_BUTTON, SETUP_APPLY_QUESTIONS_PICK_PREFIX, SETUP_APPLY_QUESTION_ADD_MODAL_PREFIX, SETUP_APPLY_QUESTION_ADD_PREFIX, SETUP_APPLY_QUESTION_REMOVE_MODAL_PREFIX, SETUP_APPLY_QUESTION_REMOVE_PREFIX } from './setup.ui.apply.views';
import { chunk, parsedEmoji, sep, text, toPayload } from './setup.ui.shared';

function questionsPickButton(category: ApplyCategory): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(`${SETUP_APPLY_QUESTIONS_PICK_PREFIX}${category.id}`)
    .setLabel(category.name.slice(0, 80))
    .setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(category.emoji);
  if (emoji) button.setEmoji(emoji);
  return button;
}

export function applyQuestionsPickerView(categories: readonly ApplyCategory[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Manage Questions'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('- __Choose which category to manage.__'));
  for (const row of chunk(categories, 5)) {
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(row.map(questionsPickButton)));
  }
  container
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(SETUP_APPLY_QUESTIONS_BACK_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary),
      ),
    );
  return toPayload(container);
}

export function applyCategoryQuestionsView(category: ApplyCategory): ReplyPayload {
  const lines = category.questions.length
    ? category.questions.map((question, index) => `**${index + 1}.** \`${question}\``).join('\n')
    : '- No questions yet. Use **Add Question** to create one.';
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${category.name} — Questions`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`**${category.questions.length}/${MAX_APPLY_QUESTIONS}**`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines));
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${SETUP_APPLY_QUESTION_ADD_PREFIX}${category.id}`)
        .setLabel('Add Question')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(category.questions.length >= MAX_APPLY_QUESTIONS),
      new ButtonBuilder()
        .setCustomId(`${SETUP_APPLY_QUESTION_REMOVE_PREFIX}${category.id}`)
        .setLabel('Remove Question')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(category.questions.length === 0),
      new ButtonBuilder().setCustomId(SETUP_APPLY_QUESTIONS_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary),
    ),
  );
  return toPayload(container);
}

export function buildApplyQuestionAddModal(categoryId: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_APPLY_QUESTION_ADD_MODAL_PREFIX}${categoryId}`)
    .setTitle('Add Question')
    .addLabelComponents(
      new LabelBuilder().setLabel('Question').setTextInputComponent((input) =>
        input.setCustomId('question').setStyle(TextInputStyle.Short).setMaxLength(150).setRequired(true).setPlaceholder('e.g. Why do you want this role?'),
      ),
    );
}

export function buildApplyQuestionRemoveModal(category: ApplyCategory): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_APPLY_QUESTION_REMOVE_MODAL_PREFIX}${category.id}`)
    .setTitle('Remove Question')
    .addLabelComponents(
      new LabelBuilder().setLabel('Question').setStringSelectMenuComponent((select) => {
        select.setCustomId('question').setMinValues(1).setMaxValues(1);
        category.questions.forEach((question, index) => {
          select.addOptions(new StringSelectMenuOptionBuilder().setLabel(question.slice(0, 100)).setValue(String(index)));
        });
        return select;
      }),
    );
}
