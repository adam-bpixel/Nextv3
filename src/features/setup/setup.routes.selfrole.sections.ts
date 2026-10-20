import crypto from 'node:crypto';
import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { storeImage } from '../../core/image-storage';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { addSelfRoleSection, editSelfRoleSection, getGuildSetup, removeSelfRoleSection, type SelfRoleMode, type SelfRoleSection } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_SELFROLE_ADD_BUTTON,
  SETUP_SELFROLE_ADD_MODAL,
  SETUP_SELFROLE_BUTTON,
  SETUP_SELFROLE_EDIT_BACK_BUTTON,
  SETUP_SELFROLE_EDIT_BUTTON,
  SETUP_SELFROLE_EDIT_MODAL_PREFIX,
  SETUP_SELFROLE_EDIT_PICK_PREFIX,
  SETUP_SELFROLE_REMOVE_BUTTON,
  SETUP_SELFROLE_REMOVE_MODAL,
  selfRoleEditPickerView,
  selfRoleSectionsView,
} from './setup.ui.selfrole';
import { buildSelfRoleSectionAddModal, buildSelfRoleSectionEditModal, buildSelfRoleSectionRemoveModal } from './setup.ui.selfrole.modals';

export const selfRoleSectionRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_SELFROLE_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_SELFROLE_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(selfRoleSectionsView(setup.selfRoleSections ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_ADD_BUTTON,
    async handle(interaction) {
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildSelfRoleSectionAddModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:selfrole:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_SELFROLE_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const name = interaction.fields.getTextInputValue('name').trim();
      const mode = (interaction.fields.getStringSelectValues('mode')[0] ?? 'single') as SelfRoleMode;
      const description = interaction.fields.getTextInputValue('description').trim();
      const color = interaction.fields.getTextInputValue('color').trim();
      const uploadedImage = interaction.fields.getUploadedFiles('image', false)?.first();
      if (!name) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Give the section a name.'));
        return;
      }
      if (color && !/^#?[0-9a-f]{6}$/i.test(color)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Enter a valid hex color, for example #5865F2.'));
        return;
      }
      await interaction.deferUpdate();
      let imageURL: string | undefined;
      try {
        if (uploadedImage) imageURL = await storeImage(uploadedImage.url, uploadedImage.name || 'selfrole-section-image.png');
      } catch (error) {
        console.error('Storing self role section image failed:', error);
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'The image could not be saved. Check the webhook URL and make sure the image is under 8 MB.'));
        return;
      }
      const section: SelfRoleSection = {
        id: crypto.randomBytes(4).toString('hex'),
        name,
        mode,
        buttons: [],
        ...(description ? { description } : {}),
        ...(color ? { color: color.startsWith('#') ? color : `#${color}` } : {}),
        ...(imageURL ? { imageURL } : {}),
      };
      let sections: SelfRoleSection[];
      try {
        sections = await addSelfRoleSection(guild.id, section);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that section.'));
        return;
      }
      await interaction.editReply(selfRoleSectionsView(sections));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const sections = setup.selfRoleSections ?? [];
      if (!sections.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no sections to remove yet.'));
        return;
      }
      await interaction.showModal(buildSelfRoleSectionRemoveModal(sections));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:selfrole:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_SELFROLE_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.fields.getStringSelectValues('section')[0];
      if (!sectionId) return;
      await interaction.deferUpdate();
      const sections = await removeSelfRoleSection(guild.id, sectionId);
      await interaction.editReply(selfRoleSectionsView(sections));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:edit:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_EDIT_BUTTON,
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
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'There are no sections to edit yet.'));
        return;
      }
      await interaction.editReply(selfRoleEditPickerView(sections));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:edit:back',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_EDIT_BACK_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(selfRoleSectionsView(setup.selfRoleSections ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:edit:pick',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_SELFROLE_EDIT_PICK_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_EDIT_PICK_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const section = (setup.selfRoleSections ?? []).find((candidate) => candidate.id === sectionId);
      if (!section) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That section no longer exists.'));
        return;
      }
      await interaction.showModal(buildSelfRoleSectionEditModal(section));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:selfrole:edit:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_SELFROLE_EDIT_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionId = interaction.customId.slice(SETUP_SELFROLE_EDIT_MODAL_PREFIX.length);
      const name = interaction.fields.getTextInputValue('name').trim();
      const mode = (interaction.fields.getStringSelectValues('mode')[0] ?? 'single') as SelfRoleMode;
      const description = interaction.fields.getTextInputValue('description').trim();
      const color = interaction.fields.getTextInputValue('color').trim();
      const uploadedImage = interaction.fields.getUploadedFiles('image', false)?.first();
      if (!name) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Give the section a name.'));
        return;
      }
      if (color && !/^#?[0-9a-f]{6}$/i.test(color)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Enter a valid hex color, for example #5865F2.'));
        return;
      }
      await interaction.deferUpdate();
      let imageURL: string | undefined;
      try {
        if (uploadedImage) imageURL = await storeImage(uploadedImage.url, uploadedImage.name || 'selfrole-section-image.png');
      } catch (error) {
        console.error('Storing self role section image failed:', error);
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'The image could not be saved. Check the webhook URL and make sure the image is under 8 MB.'));
        return;
      }
      let sections: SelfRoleSection[];
      try {
        sections = await editSelfRoleSection(guild.id, sectionId, {
          name,
          mode,
          ...(description ? { description } : {}),
          ...(color ? { color: color.startsWith('#') ? color : `#${color}` } : {}),
          ...(imageURL ? { imageURL } : {}),
        });
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not edit that section.'));
        return;
      }
      await interaction.editReply(selfRoleSectionsView(sections));
    },
  }),
];
