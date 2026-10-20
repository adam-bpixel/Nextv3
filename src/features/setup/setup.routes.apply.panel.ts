import crypto from 'node:crypto';
import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { storeImage } from '../../core/image-storage';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import {
  addApplyCategory,
  editApplyCategory,
  getGuildSetup,
  removeApplyCategory,
  saveApplyPanelText,
  saveApplySettings,
  type ApplyCategory,
  type ApplySettings,
  type TicketPanelStyle,
} from './setup.model';
import { NO_PERMISSION_TEXT, PANEL_CHANNEL_TYPES, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_APPLY_ADD_BUTTON,
  SETUP_APPLY_ADD_MODAL,
  SETUP_APPLY_BUTTON,
  SETUP_APPLY_CUSTOMIZE_BUTTON,
  SETUP_APPLY_CUSTOMIZE_MODAL,
  SETUP_APPLY_EDIT_BACK_BUTTON,
  SETUP_APPLY_EDIT_BUTTON,
  SETUP_APPLY_EDIT_MODAL_PREFIX,
  SETUP_APPLY_EDIT_PICK_PREFIX,
  SETUP_APPLY_REMOVE_BUTTON,
  SETUP_APPLY_REMOVE_MODAL,
  SETUP_APPLY_SEND_BUTTON,
  SETUP_APPLY_SEND_MODAL,
  applyCategoriesView,
  applyEditPickerView,
  applyPanel,
  buildApplyCategoryAddModal,
  buildApplyCategoryEditModal,
  buildApplyCategoryRemoveModal,
  buildApplyPanelTextModal,
  buildApplySendModal,
} from './setup.ui.apply';
import { isValidEmojiToken } from './setup.ui.shared';

export const applyPanelRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:apply:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_APPLY_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_APPLY_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(applyCategoriesView(setup.applyCategories ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:customize:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_CUSTOMIZE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      await interaction.showModal(buildApplyPanelTextModal(setup.applyPanelText));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:customize:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_APPLY_CUSTOMIZE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const title = interaction.fields.getTextInputValue('title').trim();
      const text = interaction.fields.getTextInputValue('text').trim();
      await saveApplyPanelText(guild.id, { ...(title && { title }), ...(text && { text }) });
      await interaction.reply(
        themedReplyFor(interaction.guildId, true, 'success', 'Panel text updated. Use **Send** again to post the panel with the new text.'),
      );
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_ADD_BUTTON,
    async handle(interaction) {
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildApplyCategoryAddModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_APPLY_ADD_MODAL,
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
      const category: ApplyCategory = {
        id: crypto.randomBytes(4).toString('hex'),
        name,
        ...(description && { description }),
        ...(emoji && { emoji }),
        questions: [],
      };
      let categories: ApplyCategory[];
      try {
        categories = await addApplyCategory(guild.id, category);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that category.'));
        return;
      }
      await interaction.editReply(applyCategoriesView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const categories = setup.applyCategories ?? [];
      if (!categories.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no apply categories to remove yet.'));
        return;
      }
      await interaction.showModal(buildApplyCategoryRemoveModal(categories));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_APPLY_REMOVE_MODAL,
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
      const categories = await removeApplyCategory(guild.id, categoryId);
      await interaction.editReply(applyCategoriesView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:edit:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_EDIT_BUTTON,
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
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'There are no apply categories to edit yet.'));
        return;
      }
      await interaction.editReply(applyEditPickerView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:edit:back',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_EDIT_BACK_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      await interaction.deferUpdate();
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(applyCategoriesView(setup.applyCategories ?? []));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:edit:pick',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_APPLY_EDIT_PICK_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_EDIT_PICK_PREFIX.length);
      const setup = await getGuildSetup(guild.id);
      const category = (setup.applyCategories ?? []).find((candidate) => candidate.id === categoryId);
      if (!category) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That category no longer exists.'));
        return;
      }
      await interaction.showModal(buildApplyCategoryEditModal(category));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:edit:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_APPLY_EDIT_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const categoryId = interaction.customId.slice(SETUP_APPLY_EDIT_MODAL_PREFIX.length);
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
      let categories: ApplyCategory[];
      try {
        categories = await editApplyCategory(guild.id, categoryId, { name, ...(description && { description }), ...(emoji && { emoji }) });
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not edit that category.'));
        return;
      }
      await interaction.editReply(applyCategoriesView(categories));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:send:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_APPLY_SEND_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      if (!(setup.applyCategories ?? []).length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Add at least one category first.'));
        return;
      }
      const saved = setup.apply;
      let defaults: ApplySettings | undefined;
      if (saved) {
        const { panelChannelId, ...rest } = saved;
        defaults = {
          ...rest,
          logChannelId: guild.channels.cache.has(saved.logChannelId) ? saved.logChannelId : '',
          managerRoleIds: saved.managerRoleIds.filter((roleId) => guild.roles.cache.has(roleId)),
          ...(panelChannelId && guild.channels.cache.has(panelChannelId) ? { panelChannelId } : {}),
        };
      }
      await interaction.showModal(buildApplySendModal(defaults));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:send:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_APPLY_SEND_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const channel = interaction.fields.getSelectedChannels('panel_channel', true, PANEL_CHANNEL_TYPES).first();
      const reviewChannel = interaction.fields.getSelectedChannels('review_channel', true, PANEL_CHANNEL_TYPES).first();
      const managerRoles = interaction.fields.getSelectedRoles('manager_roles', true);
      if (!channel || !reviewChannel || !managerRoles.size) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick the panel channel, the review channel, and at least one manager role.'));
        return;
      }
      const panelStyle = (interaction.fields.getStringSelectValues('panel_style')[0] ?? 'button') as TicketPanelStyle;
      const uploadedImage = interaction.fields.getUploadedFiles('panel_image', false)?.first();

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const setup = await getGuildSetup(guild.id);
      const categories = setup.applyCategories ?? [];
      if (!categories.length) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'Add at least one category first.'));
        return;
      }

      let panelImageURL = setup.apply?.panelImageURL;
      try {
        if (uploadedImage) panelImageURL = await storeImage(uploadedImage.url, uploadedImage.name || 'apply-panel-image.png');
      } catch (error) {
        console.error('Storing apply panel image failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'The apply image could not be saved. Check the webhook URL and make sure the image is under 8 MB.'));
        return;
      }

      const settings = {
        logChannelId: reviewChannel.id,
        panelStyle,
        managerRoleIds: [...managerRoles.keys()],
        panelChannelId: channel.id,
        ...(panelImageURL ? { panelImageURL } : {}),
      };
      try {
        await channel.send(applyPanel(guild.name, guild.iconURL({ size: 256 }), categories, settings, setup.applyPanelText));
      } catch (error) {
        console.error('Sending apply panel failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', `I couldn't send the panel in <#${channel.id}> - check my permissions there.`));
        return;
      }
      await saveApplySettings(guild.id, settings);
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', `Apply panel posted in <#${channel.id}>.`));
    },
  }),
];
