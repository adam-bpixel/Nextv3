import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_APPLY_CATEGORIES, MAX_APPLY_QUESTIONS, type ApplyCategory } from './setup.model';
import { chunk, parsedEmoji, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_APPLY_BUTTON = 'setup:apply:view:';
export const SETUP_APPLY_ADD_BUTTON = 'setup:apply:add';
export const SETUP_APPLY_REMOVE_BUTTON = 'setup:apply:remove';
export const SETUP_APPLY_EDIT_BUTTON = 'setup:apply:edit';
export const SETUP_APPLY_EDIT_BACK_BUTTON = 'setup:apply:edit:back';
export const SETUP_APPLY_EDIT_PICK_PREFIX = 'setup:apply:edit:pick:';
export const SETUP_APPLY_EDIT_MODAL_PREFIX = 'setup:apply:modal:edit:';
export const SETUP_APPLY_QUESTIONS_BUTTON = 'setup:apply:questions';
export const SETUP_APPLY_QUESTIONS_BACK_BUTTON = 'setup:apply:questions:back';
export const SETUP_APPLY_SEND_BUTTON = 'setup:apply:send';
export const SETUP_APPLY_CUSTOMIZE_BUTTON = 'setup:apply:customize';
export const SETUP_APPLY_ADD_MODAL = 'setup:apply:modal:add';
export const SETUP_APPLY_REMOVE_MODAL = 'setup:apply:modal:remove';
export const SETUP_APPLY_SEND_MODAL = 'setup:apply:modal:send';
export const SETUP_APPLY_CUSTOMIZE_MODAL = 'setup:apply:modal:customize';
export const SETUP_APPLY_QUESTIONS_PICK_PREFIX = 'setup:apply:questions:pick:';
export const SETUP_APPLY_QUESTION_ADD_PREFIX = 'setup:apply:question:add:';
export const SETUP_APPLY_QUESTION_REMOVE_PREFIX = 'setup:apply:question:remove:';
export const SETUP_APPLY_QUESTION_ADD_MODAL_PREFIX = 'setup:apply:modal:question:add:';
export const SETUP_APPLY_QUESTION_REMOVE_MODAL_PREFIX = 'setup:apply:modal:question:remove:';
export const APPLY_OPEN_PREFIX = 'setup:apply:open:';
export const APPLY_OPEN_SELECT_ID = `${APPLY_OPEN_PREFIX}select`;
export const APPLY_FORM_PREFIX = 'setup:apply:modal:form:';
export const APPLY_ACCEPT_BUTTON = 'setup:apply:decision:accept';
export const APPLY_REJECT_BUTTON = 'setup:apply:decision:reject';

function applyCategoryLine(category: ApplyCategory): string {
  const emoji = category.emoji ? `${category.emoji} ` : '';
  const description = category.description ? ` : \`${category.description}\`` : '';
  return `- ${emoji}**${category.name}**${description} (**${category.questions.length}/${MAX_APPLY_QUESTIONS}**)`;
}

export function applyCategoriesView(categories: readonly ApplyCategory[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Apply Categories'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`__${categories.length}/${MAX_APPLY_CATEGORIES} categories__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(categories.length ? categories.map(applyCategoryLine).join('\n') : '- No categories yet. Use **Add** to create one.'),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SETUP_APPLY_ADD_BUTTON)
        .setLabel('Add')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length >= MAX_APPLY_CATEGORIES),
      new ButtonBuilder()
        .setCustomId(SETUP_APPLY_REMOVE_BUTTON)
        .setLabel('Remove')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_APPLY_EDIT_BUTTON)
        .setLabel('Edit')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_APPLY_QUESTIONS_BUTTON)
        .setLabel('Questions')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_APPLY_SEND_BUTTON)
        .setLabel('Send')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_APPLY_CUSTOMIZE_BUTTON).setLabel('Customize Text').setStyle(ButtonStyle.Secondary),
    ),
  );
  return toPayload(container);
}

function editApplyPickButton(category: ApplyCategory): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(`${SETUP_APPLY_EDIT_PICK_PREFIX}${category.id}`)
    .setLabel(category.name.slice(0, 80))
    .setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(category.emoji);
  if (emoji) button.setEmoji(emoji);
  return button;
}

export function applyEditPickerView(categories: readonly ApplyCategory[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Edit Apply Category'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('- __Choose which category to edit.__'));
  for (const row of chunk(categories, 5)) {
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(row.map(editApplyPickButton)));
  }
  container
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(SETUP_APPLY_EDIT_BACK_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary)),
    );
  return toPayload(container);
}

export function buildApplyCategoryEditModal(category: ApplyCategory): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_APPLY_EDIT_MODAL_PREFIX}${category.id}`)
    .setTitle('Edit Apply Category')
    .addLabelComponents(
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setValue(category.name),
      ),
      new LabelBuilder().setLabel('Description').setDescription('Optional — shown next to the category').setTextInputComponent((input) => {
        input.setCustomId('description').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('What this position is for');
        return category.description ? input.setValue(category.description) : input;
      }),
      new LabelBuilder().setLabel('Emoji').setDescription('Optional — a normal emoji or a custom one like <:name:id>').setTextInputComponent((input) => {
        input.setCustomId('emoji').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('Put your emoji');
        return category.emoji ? input.setValue(category.emoji) : input;
      }),
    );
}

export function buildApplyCategoryAddModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_APPLY_ADD_MODAL)
    .setTitle('Add Apply Category')
    .addLabelComponents(
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setPlaceholder('e.g. Moderator'),
      ),
      new LabelBuilder().setLabel('Description').setDescription('Optional — shown next to the category').setTextInputComponent((input) =>
        input.setCustomId('description').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('What this position is for'),
      ),
      new LabelBuilder().setLabel('Emoji').setDescription('Optional — a normal emoji or a custom one like <:name:id>').setTextInputComponent((input) =>
        input.setCustomId('emoji').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('Put your emoji'),
      ),
    );
}

export function buildApplyCategoryRemoveModal(categories: readonly ApplyCategory[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_APPLY_REMOVE_MODAL)
    .setTitle('Remove Apply Category')
    .addLabelComponents(
      new LabelBuilder().setLabel('Category').setStringSelectMenuComponent((select) => {
        select.setCustomId('category').setMinValues(1).setMaxValues(1);
        for (const category of categories) {
          const option = new StringSelectMenuOptionBuilder()
            .setLabel(category.name.slice(0, 100))
            .setValue(category.id)
            .setDescription((category.description ?? `${category.questions.length} question(s)`).slice(0, 100));
          const emoji = parsedEmoji(category.emoji);
          if (emoji) option.setEmoji(emoji);
          select.addOptions(option);
        }
        return select;
      }),
    );
}
