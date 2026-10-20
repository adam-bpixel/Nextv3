import { ChannelType, MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { storeImage } from '../../core/image-storage';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { getGuildSetup, saveTicketPanelText, saveTicketSettings, type TicketPanelStyle, type TicketSettings } from './setup.model';
import { NO_PERMISSION_TEXT, PANEL_CHANNEL_TYPES, hasManageGuild } from './setup.routes.helpers';
import {
  SETUP_TICKET_CUSTOMIZE_BUTTON,
  SETUP_TICKET_CUSTOMIZE_MODAL,
  SETUP_TICKET_SEND_BUTTON,
  SETUP_TICKET_SEND_MODAL,
  buildTicketPanelTextModal,
  buildTicketSendModal,
  ticketPanel,
} from './setup.ui.ticket';

export const ticketPanelRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:send:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TICKET_SEND_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      if (!(setup.ticketCategories ?? []).length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Add at least one category first.'));
        return;
      }
      const saved = setup.ticket;
      let defaults: TicketSettings | undefined;
      if (saved) {
        const { panelChannelId, ...rest } = saved;
        defaults = {
          ...rest,
          categoryId: guild.channels.cache.has(saved.categoryId) ? saved.categoryId : '',
          logChannelId: guild.channels.cache.has(saved.logChannelId) ? saved.logChannelId : '',
          ...(panelChannelId && guild.channels.cache.has(panelChannelId) ? { panelChannelId } : {}),
        };
      }
      await interaction.showModal(buildTicketSendModal(defaults));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:ticket:send:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_TICKET_SEND_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const ticketCategory = interaction.fields.getSelectedChannels('ticket_category', true, [ChannelType.GuildCategory] as const).first();
      const channel = interaction.fields.getSelectedChannels('panel_channel', true, PANEL_CHANNEL_TYPES).first();
      const logChannel = interaction.fields.getSelectedChannels('log_channel', true, PANEL_CHANNEL_TYPES).first();
      if (!ticketCategory || !channel || !logChannel) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick the ticket category, the panel channel, and the log channel.'));
        return;
      }
      const panelStyle = (interaction.fields.getStringSelectValues('panel_style')[0] ?? 'button') as TicketPanelStyle;
      const uploadedImage = interaction.fields.getUploadedFiles('panel_image', false)?.first();

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const setup = await getGuildSetup(guild.id);
      const categories = setup.ticketCategories ?? [];
      if (!categories.length) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'Add at least one category first.'));
        return;
      }

      let panelImageURL = setup.ticket?.panelImageURL;
      try {
        if (uploadedImage) panelImageURL = await storeImage(uploadedImage.url, uploadedImage.name || 'ticket-panel-image.png');
      } catch (error) {
        console.error('Storing ticket panel image failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'The ticket image could not be saved. Check the webhook URL and make sure the image is under 8 MB.'));
        return;
      }

      const settings = {
        categoryId: ticketCategory.id,
        logChannelId: logChannel.id,
        panelChannelId: channel.id,
        panelStyle,
        ...(panelImageURL ? { panelImageURL } : {}),
      };
      try {
        await channel.send(ticketPanel(guild.name, guild.iconURL({ size: 256 }), categories, settings, setup.ticketPanelText));
      } catch (error) {
        console.error('Sending ticket panel failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', `I couldn't send the panel in <#${channel.id}> - check my permissions there.`));
        return;
      }
      await saveTicketSettings(guild.id, settings);
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', `Ticket panel posted in <#${channel.id}>.`));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:customize:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TICKET_CUSTOMIZE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      await interaction.showModal(buildTicketPanelTextModal(setup.ticketPanelText));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:ticket:customize:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_TICKET_CUSTOMIZE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const title = interaction.fields.getTextInputValue('title').trim();
      const text = interaction.fields.getTextInputValue('text').trim();
      await saveTicketPanelText(guild.id, { ...(title && { title }), ...(text && { text }) });
      await interaction.reply(
        themedReplyFor(interaction.guildId, true, 'success', 'Panel text updated. Use **Send** again to post the panel with the new text.'),
      );
    },
  }),
];
