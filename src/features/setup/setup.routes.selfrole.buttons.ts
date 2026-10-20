import type { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { addSelfRoleButton, getGuildSetup, removeSelfRoleButton, type SelfRoleSection } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild } from './setup.routes.helpers';
import {
  SETUP_SELFROLE_BUTTONS_BACK_BUTTON,
  SETUP_SELFROLE_BUTTONS_BUTTON,
  SETUP_SELFROLE_BUTTONS_PICK_PREFIX,
  SETUP_SELFROLE_BUTTON_ADD_MODAL_PREFIX,
  SETUP_SELFROLE_BUTTON_ADD_PREFIX,
  SETUP_SELFROLE_BUTTON_REMOVE_MODAL_PREFIX,
  SETUP_SELFROLE_BUTTON_REMOVE_PREFIX,
  selfRoleButtonsPickerView,
  selfRoleSectionButtonsView,
  selfRoleSectionsView,
} from './setup.ui.selfrole';
import { buildSelfRoleButtonAddModal, buildSelfRoleButtonRemoveModal } from './setup.ui.selfrole.modals';
import { isValidEmojiToken } from './setup.ui.shared';

export const selfRoleButtonRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:buttons:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_BUTTONS_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      const sections = setup.selfRoleSections ?? [];
      if (!sections.length) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'There are no sections to manage yet.'));
        return;
      }
      await interaction.editReply(selfRoleButtonsPickerView(sections));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:buttons:back',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_BUTTONS_BACK_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(selfRoleSectionsView(setup.selfRoleSections ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:buttons:pick',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_SELFROLE_BUTTONS_PICK_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_BUTTONS_PICK_PREFIX.length);
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      const section = (setup.selfRoleSections ?? []).find((candidate) => candidate.id === sectionId);
      if (!section) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'That section no longer exists.'));
        return;
      }
      await interaction.editReply(selfRoleSectionButtonsView(section));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:button:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_SELFROLE_BUTTON_ADD_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_BUTTON_ADD_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const section = (setup.selfRoleSections ?? []).find((candidate) => candidate.id === sectionId);
      if (!section) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That section no longer exists.'));
        return;
      }
      await interaction.showModal(buildSelfRoleButtonAddModal(sectionId));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:selfrole:button:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction =>
      interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_SELFROLE_BUTTON_ADD_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_BUTTON_ADD_MODAL_PREFIX.length);
      const role = interaction.fields.getSelectedRoles('role', true).first();
      const label = interaction.fields.getTextInputValue('label').trim();
      const emoji = interaction.fields.getTextInputValue('emoji').trim();
      if (!role) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick a role.'));
        return;
      }
      if (role.id === guild.id || role.managed) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "That role can't be used - it's either the default role or managed by an integration."));
        return;
      }
      if (emoji && !isValidEmojiToken(emoji)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'That emoji is not valid. Use a normal emoji or a custom one like <:name:id>.'));
        return;
      }
      await interaction.deferUpdate();
      let section: SelfRoleSection;
      try {
        section = await addSelfRoleButton(guild.id, sectionId, { roleId: role.id, label: label || role.name, ...(emoji && { emoji }) });
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that role.'));
        return;
      }
      await interaction.editReply(selfRoleSectionButtonsView(section));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:button:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_SELFROLE_BUTTON_REMOVE_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_BUTTON_REMOVE_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const section = (setup.selfRoleSections ?? []).find((candidate) => candidate.id === sectionId);
      if (!section || !section.buttons.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no roles to remove yet.'));
        return;
      }
      await interaction.showModal(buildSelfRoleButtonRemoveModal(section));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:selfrole:button:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction =>
      interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_SELFROLE_BUTTON_REMOVE_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_BUTTON_REMOVE_MODAL_PREFIX.length);
      const roleId = interaction.fields.getStringSelectValues('role')[0];
      if (!roleId) return;
      await interaction.deferUpdate();
      const section = await removeSelfRoleButton(guild.id, sectionId, roleId);
      await interaction.editReply(selfRoleSectionButtonsView(section));
    },
  }),
];
