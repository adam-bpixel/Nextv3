import { MessageFlags, PermissionFlagsBits, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import config from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { ADD_BOT_BUTTON, ADD_BOT_MODAL, buildAddBotModal } from './addBot.ui';
import { getSuggestionSettings } from './owner.model';
import { addFleetBotFromToken } from './owner.logic.fleet';
import { serversListCard } from './serversList.ui';
import {
  SUGGEST_DECISION_PREFIX,
  SUGGEST_MODAL_ID,
  SUGGEST_OPEN_ID,
  suggestModal,
  suggestionDecision,
  suggestionReview,
} from './suggestions.ui';

const SERVERS_PAGE_CUSTOM_ID = /^owner:servers:(\d{15,22}):(-?\d+)$/;

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'owner:servers:page',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && SERVERS_PAGE_CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = SERVERS_PAGE_CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, invokerId, pageText] = parsed as unknown as [string, string, string];
      if (interaction.user.id !== config.ownerId || interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Only the bot owner can use this.'));
        return;
      }
      const guilds = [...interaction.client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
      const accent = (interaction.guildId ? cachedColor(interaction.guildId) : undefined) ?? config.color;
      await interaction.update(serversListCard(accent, guilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL({ size: 128 }),
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
      })), Number(pageText), invokerId));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'owner:addbot:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === ADD_BOT_BUTTON,
    async handle(interaction) {
      if (interaction.user.id !== config.ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Only the bot owner can do that.'));
        return;
      }
      await interaction.showModal(buildAddBotModal());
    },
  }),
  defineRoute<ModalSubmitInteraction>({
    name: 'owner:addbot:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === ADD_BOT_MODAL,
    async handle(interaction) {
      if (interaction.user.id !== config.ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Only the bot owner can do that.'));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const token = interaction.fields.getTextInputValue('token').trim();
      const name = interaction.fields.getTextInputValue('name').trim() || undefined;
      const result = await addFleetBotFromToken(token, name, interaction.user.id, interaction.client);
      await interaction.editReply(themedReplyFor(interaction.guildId, true, result.ok ? 'success' : 'error', result.message));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'owner:suggestion:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SUGGEST_OPEN_ID,
    async handle(interaction) {
      if (!interaction.guildId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Use this panel inside a server.'));
        return;
      }
      const settings = await getSuggestionSettings(interaction.guildId);
      if (!settings.reviewChannelId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Suggestions are not configured in this server.'));
        return;
      }
      await interaction.showModal(suggestModal());
    },
  }),
  defineRoute<ModalSubmitInteraction>({
    name: 'owner:suggestion:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SUGGEST_MODAL_ID,
    async handle(interaction) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'Use this form inside a server.'));
        return;
      }
      const settings = await getSuggestionSettings(guild.id);
      const channel = settings.reviewChannelId ? await interaction.client.channels.fetch(settings.reviewChannelId).catch(() => null) : null;
      if (!channel?.isSendable()) {
        await interaction.editReply(themedReplyFor(guild.id, true, 'error', 'The suggestions review channel is unavailable.'));
        return;
      }
      const title = interaction.fields.getTextInputValue('title').trim();
      const description = interaction.fields.getTextInputValue('description').trim();
      const why = interaction.fields.getTextInputValue('why').trim();
      const sent = await channel.send(suggestionReview(interaction.user.id, guild.name, title, description, why)).catch(() => null);
      await interaction.editReply(themedReplyFor(guild.id, true, sent ? 'success' : 'error', sent ? 'Your suggestion was sent to the team.' : 'The suggestion could not be sent.'));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'owner:suggestion:decision',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SUGGEST_DECISION_PREFIX),
    async handle(interaction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'You need Manage Messages permission to review suggestions.'));
        return;
      }
      const [, action, userId] = interaction.customId.slice(SUGGEST_DECISION_PREFIX.length).split(':');
      if ((action !== 'accept' && action !== 'reject') || !userId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'This suggestion action is invalid.'));
        return;
      }
      const accepted = action === 'accept';
      await interaction.update(suggestionDecision(accepted, interaction.user.id));
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      if (user) {
        await user.send(themedReplyFor(null, false, accepted ? 'success' : 'error', accepted ? 'Your feature suggestion was accepted. Thank you!' : 'Your feature suggestion was rejected.')).catch(() => undefined);
      }
    },
  }),
];
