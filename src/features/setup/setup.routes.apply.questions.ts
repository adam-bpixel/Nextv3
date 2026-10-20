import type { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { addApplyQuestion, getGuildSetup, removeApplyQuestion, type ApplyCategory } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild } from './setup.routes.helpers';
import {
  SETUP_APPLY_QUESTIONS_BACK_BUTTON,
  SETUP_APPLY_QUESTIONS_BUTTON,
  SETUP_APPLY_QUESTIONS_PICK_PREFIX,
  SETUP_APPLY_QUESTION_ADD_MODAL_PREFIX,
  SETUP_APPLY_QUESTION_ADD_PREFIX,
  SETUP_APPLY_QUESTION_REMOVE_MODAL_PREFIX,
  SETUP_APPLY_QUESTION_REMOVE_PREFIX,
  applyCategoriesView,
  applyCategoryQuestionsView,
  applyQuestionsPickerView,
  buildApplyQuestionAddModal,
  buildApplyQuestionRemoveModal,
} from './setup.ui.apply';

export const applyQuestionRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:apply:questions:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_QUESTIONS_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      const categories = setup.applyCategories ?? [];
      if (!categories.length) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'There are no apply categories to manage yet.'));
        return;
      }
      await interaction.editReply(applyQuestionsPickerView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:questions:back',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_QUESTIONS_BACK_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(applyCategoriesView(setup.applyCategories ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:questions:pick',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_APPLY_QUESTIONS_PICK_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_QUESTIONS_PICK_PREFIX.length);
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      const category = (setup.applyCategories ?? []).find((candidate) => candidate.id === categoryId);
      if (!category) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'That category no longer exists.'));
        return;
      }
      await interaction.editReply(applyCategoryQuestionsView(category));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:question:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_APPLY_QUESTION_ADD_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_QUESTION_ADD_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const category = (setup.applyCategories ?? []).find((candidate) => candidate.id === categoryId);
      if (!category) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That category no longer exists.'));
        return;
      }
      await interaction.showModal(buildApplyQuestionAddModal(categoryId));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:question:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction =>
      interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_APPLY_QUESTION_ADD_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_QUESTION_ADD_MODAL_PREFIX.length);
      const question = interaction.fields.getTextInputValue('question').trim();
      if (!question) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Give the question some text.'));
        return;
      }
      await interaction.deferUpdate();
      let category: ApplyCategory;
      try {
        category = await addApplyQuestion(guild.id, categoryId, question);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that question.'));
        return;
      }
      await interaction.editReply(applyCategoryQuestionsView(category));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:question:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_APPLY_QUESTION_REMOVE_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_QUESTION_REMOVE_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const category = (setup.applyCategories ?? []).find((candidate) => candidate.id === categoryId);
      if (!category || !category.questions.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no questions to remove yet.'));
        return;
      }
      await interaction.showModal(buildApplyQuestionRemoveModal(category));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:question:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction =>
      interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_APPLY_QUESTION_REMOVE_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_QUESTION_REMOVE_MODAL_PREFIX.length);
      const questionIndex = Number(interaction.fields.getStringSelectValues('question')[0]);
      if (Number.isNaN(questionIndex)) return;
      await interaction.deferUpdate();
      const category = await removeApplyQuestion(guild.id, categoryId, questionIndex);
      await interaction.editReply(applyCategoryQuestionsView(category));
    },
  }),
];
