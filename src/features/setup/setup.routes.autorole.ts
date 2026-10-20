import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_AUTO_ROLES, addAutoRole, getGuildSetup, removeAutoRole } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_AUTOROLE_ADD_BUTTON,
  SETUP_AUTOROLE_ADD_MODAL,
  SETUP_AUTOROLE_BUTTON,
  SETUP_AUTOROLE_REMOVE_BUTTON,
  SETUP_AUTOROLE_REMOVE_MODAL,
  autoRoleView,
  buildAutoRoleAddModal,
  buildAutoRoleRemoveModal,
} from './setup.ui.autorole';

export const autoRoleRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:autorole:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_AUTOROLE_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_AUTOROLE_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      const roles = (setup.autoRoleIds ?? [])
        .filter((roleId) => guild.roles.cache.has(roleId))
        .map((id) => ({ id, name: guild.roles.cache.get(id)?.name ?? id }));
      await interaction.editReply(autoRoleView(roles));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:autorole:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_AUTOROLE_ADD_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const existing = (setup.autoRoleIds ?? []).filter((roleId) => guild.roles.cache.has(roleId));
      const remainingSlots = MAX_AUTO_ROLES - existing.length;
      if (remainingSlots <= 0) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `You can add up to ${MAX_AUTO_ROLES} auto roles.`));
        return;
      }
      await interaction.showModal(buildAutoRoleAddModal(remainingSlots));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:autorole:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_AUTOROLE_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleIds = [...(interaction.fields.getSelectedRoles('roles', false)?.keys() ?? [])];
      if (!roleIds.length) return;
      await interaction.deferUpdate();
      let updated: string[] = [];
      try {
        for (const roleId of roleIds) updated = await addAutoRole(guild.id, roleId);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that auto role.'));
      }
      const roles = updated.filter((roleId) => guild.roles.cache.has(roleId)).map((id) => ({ id, name: guild.roles.cache.get(id)?.name ?? id }));
      await interaction.editReply(autoRoleView(roles));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:autorole:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_AUTOROLE_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const roles = (setup.autoRoleIds ?? [])
        .filter((roleId) => guild.roles.cache.has(roleId))
        .map((id) => ({ id, name: guild.roles.cache.get(id)?.name ?? id }));
      if (!roles.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no auto roles to remove yet.'));
        return;
      }
      await interaction.showModal(buildAutoRoleRemoveModal(roles));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:autorole:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_AUTOROLE_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleId = interaction.fields.getStringSelectValues('role')[0];
      if (!roleId) return;
      await interaction.deferUpdate();
      const updated = await removeAutoRole(guild.id, roleId);
      const roles = updated.filter((id) => guild.roles.cache.has(id)).map((id) => ({ id, name: guild.roles.cache.get(id)?.name ?? id }));
      await interaction.editReply(autoRoleView(roles));
    },
  }),
];
