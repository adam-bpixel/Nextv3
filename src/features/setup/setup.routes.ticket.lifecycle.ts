import { ChannelType, MessageFlags, PermissionFlagsBits, type ButtonInteraction, type StringSelectMenuInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { addOpenTicket, findOpenTicket, getGuildSetup, removeOpenTicketByChannel } from './setup.model';
import { hasManageGuild } from './setup.routes.helpers';
import { getServerInviteURL } from './setup.ui.shared';
import { TICKET_CLOSE_BUTTON, TICKET_OPEN_PREFIX, TICKET_OPEN_SELECT_ID, ticketEventCard, ticketOpenedView, ticketUserNotice } from './setup.ui.ticket';

async function openTicketChannel(interaction: ButtonInteraction | StringSelectMenuInteraction, categoryId: string): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const setup = await getGuildSetup(guild.id);
  const category = (setup.ticketCategories ?? []).find((candidate) => candidate.id === categoryId);
  const ticketSettings = setup.ticket;
  if (!category || !ticketSettings) {
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'The ticket system is not set up yet.'));
    return;
  }

  const existing = findOpenTicket(setup, interaction.user.id, categoryId);
  if (existing && guild.channels.cache.has(existing.channelId)) {
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', `You already have an open ticket: <#${existing.channelId}>`));
    return;
  }

  const parent = await guild.channels.fetch(ticketSettings.categoryId).catch(() => null);
  if (!parent || parent.type !== ChannelType.GuildCategory) {
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'The configured ticket category no longer exists.'));
    return;
  }

  let channel;
  try {
    channel = await guild.channels.create({
      name: `${category.name}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: `Ticket opened by ${interaction.user.tag} - ${category.name}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: guild.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });
  } catch (error) {
    console.error('Creating ticket channel failed:', error);
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't create the ticket channel - check my permissions in that category."));
    return;
  }

  await channel.send(ticketOpenedView(interaction.user.id, category)).catch(() => null);
  await addOpenTicket(guild.id, { channelId: channel.id, userId: interaction.user.id, categoryId });

  const ticketEvent = {
    event: 'opened' as const,
    guildName: guild.name,
    channelId: channel.id,
    channelName: channel.name,
    userId: interaction.user.id,
    categoryName: category.name,
    actorId: interaction.user.id,
  };
  const logChannel = await guild.channels.fetch(ticketSettings.logChannelId).catch(() => null);
  if (logChannel?.isTextBased() && logChannel.isSendable()) {
    await logChannel.send({ ...ticketEventCard(ticketEvent), allowedMentions: { parse: [] } }).catch((error: unknown) => {
      console.error('Sending ticket-open log failed:', error);
    });
  }
  const openInviteURL = await getServerInviteURL(guild);
  await interaction.user.send(ticketUserNotice(ticketEvent, openInviteURL)).catch((error: unknown) => {
    console.warn(`Could not DM ticket-open notice to ${interaction.user.id}:`, error);
  });

  await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', `Your ticket has been created: <#${channel.id}>`));
}

export const ticketLifecycleRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:open:button',
    match: (interaction): interaction is ButtonInteraction =>
      interaction.isButton() && interaction.customId.startsWith(TICKET_OPEN_PREFIX) && interaction.customId !== TICKET_OPEN_SELECT_ID,
    async handle(interaction) {
      await openTicketChannel(interaction, interaction.customId.slice(TICKET_OPEN_PREFIX.length));
    },
  }),

  defineRoute<StringSelectMenuInteraction>({
    name: 'setup:ticket:open:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId === TICKET_OPEN_SELECT_ID,
    async handle(interaction) {
      const categoryId = interaction.values[0];
      if (!categoryId) return;
      await openTicketChannel(interaction, categoryId);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:ticket:close',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === TICKET_CLOSE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      const channel = interaction.channel;
      if (!guild || !channel) return;

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const setup = await getGuildSetup(guild.id);
      const ticket = (setup.openTickets ?? []).find((candidate) => candidate.channelId === channel.id);
      const canClose = ticket?.userId === interaction.user.id || hasManageGuild(interaction);
      if (!canClose) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', "You don't have permission to close this ticket."));
        return;
      }

      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', 'Closing this ticket...'));
      await interaction.followUp(themedReplyFor(interaction.guildId, false, 'success', 'This ticket will be deleted in 5 seconds.'));
      await removeOpenTicketByChannel(guild.id, channel.id);

      const ticketOwner = ticket ? await interaction.client.users.fetch(ticket.userId).catch(() => null) : null;
      const categoryName = setup.ticketCategories?.find((candidate) => candidate.id === ticket?.categoryId)?.name ?? ticket?.categoryId ?? 'Unknown';
      const ticketEvent = {
        event: 'closed' as const,
        guildName: guild.name,
        channelId: channel.id,
        channelName: ('name' in channel && channel.name) ? channel.name : channel.id,
        userId: ticket?.userId ?? interaction.user.id,
        categoryName,
        actorId: interaction.user.id,
      };
      const logChannel = setup.ticket ? await guild.channels.fetch(setup.ticket.logChannelId).catch(() => null) : null;
      if (logChannel?.isTextBased() && logChannel.isSendable()) {
        await logChannel.send({ ...ticketEventCard(ticketEvent), allowedMentions: { parse: [] } }).catch((error: unknown) => {
          console.error('Sending ticket-close log failed:', error);
        });
      }
      if (ticketOwner) {
        const closeInviteURL = await getServerInviteURL(guild);
        await ticketOwner.send(ticketUserNotice(ticketEvent, closeInviteURL)).catch((error: unknown) => {
          console.warn(`Could not DM ticket-close notice to ${ticketOwner.id}:`, error);
        });
      }

      setTimeout(() => {
        channel.delete().catch((error: unknown) => console.error('Deleting ticket channel failed:', error));
      }, 5000);
    },
  }),
];
