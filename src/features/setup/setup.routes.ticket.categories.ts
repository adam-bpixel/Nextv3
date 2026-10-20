import crypto from 'node:crypto';
import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { addTicketCategory, editTicketCategory, getGuildSetup, removeTicketCategory, type TicketCategory } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import { isValidEmojiToken } from './setup.ui.shared';
import {
  SETUP_TICKET_ADD_BUTTON,
  SETUP_TICKET_ADD_MODAL,
  SETUP_TICKET_BUTTON,
  SETUP_TICKET_EDIT_BACK_BUTTON,
  SETUP_TICKET_EDIT_BUTTON,
  SETUP_TICKET_EDIT_MODAL_PREFIX,
  SETUP_TICKET_EDIT_PICK_PREFIX,
  SETUP_TICKET_REMOVE_BUTTON,
  SETUP_TICKET_REMOVE_MODAL,
  buildTicketCategoryAddModal,
  buildTicketCategoryEditModal,
  buildTicketCategoryRemoveModal,
  ticketCategoriesView,
  ticketEditPickerView,
} from './setup.ui.ticket';

export const ticketCategoryRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_TICKET_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_TICKET_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(ticketCategoriesView(setup.ticketCategories ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TICKET_ADD_BUTTON,
    async handle(interaction) {
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildTicketCategoryAddModal());
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TICKET_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const categories = setup.ticketCategories ?? [];
      if (!categories.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no ticket categories to remove yet.'));
        return;
      }
      await interaction.showModal(buildTicketCategoryRemoveModal(categories));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:ticket:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_TICKET_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const name = interaction.fields.getTextInputValue('name').trim();
      const description = interaction.fields.getTextInputValue('description').trim();
      const emoji = interaction.fields.getTextInputValue('emoji').trim();
      if (!name) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Give the category a name.'));
        return;
      }
      if (emoji && !isValidEmojiToken(emoji)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'That emoji is not valid. Use a normal emoji or a custom one like <:name:id>.'));
        return;
      }
      await interaction.deferUpdate();
      const category: TicketCategory = { id: crypto.randomBytes(4).toString('hex'), name, ...(description && { description }), ...(emoji && { emoji }) };
      let categories: TicketCategory[];
      try {
        categories = await addTicketCategory(guild.id, category);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that category.'));
        return;
      }
      await interaction.editReply(ticketCategoriesView(categories));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:ticket:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_TICKET_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.fields.getStringSelectValues('category')[0];
      if (!categoryId) return;
      await interaction.deferUpdate();
      const categories = await removeTicketCategory(guild.id, categoryId);
      await interaction.editReply(ticketCategoriesView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:edit:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TICKET_EDIT_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      const categories = setup.ticketCategories ?? [];
      if (!categories.length) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'There are no ticket categories to edit yet.'));
        return;
      }
      await interaction.editReply(ticketEditPickerView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:edit:back',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TICKET_EDIT_BACK_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(ticketCategoriesView(setup.ticketCategories ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:edit:pick',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_TICKET_EDIT_PICK_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_TICKET_EDIT_PICK_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const category = (setup.ticketCategories ?? []).find((candidate) => candidate.id === categoryId);
      if (!category) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That category no longer exists.'));
        return;
      }
      await interaction.showModal(buildTicketCategoryEditModal(category));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:ticket:edit:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_TICKET_EDIT_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_TICKET_EDIT_MODAL_PREFIX.length);
      const name = interaction.fields.getTextInputValue('name').trim();
      const description = interaction.fields.getTextInputValue('description').trim();
      const emoji = interaction.fields.getTextInputValue('emoji').trim();
      if (!name) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Give the category a name.'));
        return;
      }
      if (emoji && !isValidEmojiToken(emoji)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'That emoji is not valid. Use a normal emoji or a custom one like <:name:id>.'));
        return;
      }
      await interaction.deferUpdate();
      let categories: TicketCategory[];
      try {
        categories = await editTicketCategory(guild.id, categoryId, { name, ...(description && { description }), ...(emoji && { emoji }) });
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not edit that category.'));
        return;
      }
      await interaction.editReply(ticketCategoriesView(categories));
    },
  }),
];
