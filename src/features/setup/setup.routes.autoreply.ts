import crypto from 'node:crypto';
import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { addAutoReply, getGuildSetup, removeAutoReply, type AutoReplyEntry, type AutoReplyMatchType } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_AUTOREPLY_ADD_BUTTON,
  SETUP_AUTOREPLY_ADD_MODAL,
  SETUP_AUTOREPLY_BUTTON,
  SETUP_AUTOREPLY_REMOVE_BUTTON,
  SETUP_AUTOREPLY_REMOVE_MODAL,
  autoReplyView,
  buildAutoReplyAddModal,
  buildAutoReplyRemoveModal,
} from './setup.ui.autoreply';

export const autoReplyRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:autoreply:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_AUTOREPLY_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_AUTOREPLY_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(autoReplyView(setup.autoReplies ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:autoreply:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_AUTOREPLY_ADD_BUTTON,
    async handle(interaction) {
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildAutoReplyAddModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:autoreply:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_AUTOREPLY_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const trigger = interaction.fields.getTextInputValue('trigger').trim();
      const response = interaction.fields.getTextInputValue('response').trim();
      const matchType = (interaction.fields.getStringSelectValues('match_type')[0] ?? 'exact') as AutoReplyMatchType;
      if (!trigger || !response) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Give both a trigger and a response.'));
        return;
      }
      await interaction.deferUpdate();
      const entry: AutoReplyEntry = { id: crypto.randomBytes(4).toString('hex'), trigger, response, matchType };
      let entries: AutoReplyEntry[];
      try {
        entries = await addAutoReply(guild.id, entry);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that auto-reply.'));
        return;
      }
      await interaction.editReply(autoReplyView(entries));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:autoreply:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_AUTOREPLY_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const entries = setup.autoReplies ?? [];
      if (!entries.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no auto-replies to remove yet.'));
        return;
      }
      await interaction.showModal(buildAutoReplyRemoveModal(entries));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:autoreply:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_AUTOREPLY_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const entryId = interaction.fields.getStringSelectValues('entry')[0];
      if (!entryId) return;
      await interaction.deferUpdate();
      const entries = await removeAutoReply(guild.id, entryId);
      await interaction.editReply(autoReplyView(entries));
    },
  }),

];
