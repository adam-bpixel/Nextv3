import { MessageFlags, type ButtonInteraction, type Guild, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_BLACKLISTED_CHANNELS, addBlacklistedChannel, getGuildSetup, removeBlacklistedChannel } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import { LOG_CHANNEL_TYPES } from './setup.ui.shared';
import {
  SETUP_BLACKLIST_ADD_BUTTON,
  SETUP_BLACKLIST_ADD_MODAL,
  SETUP_BLACKLIST_BUTTON,
  SETUP_BLACKLIST_REMOVE_BUTTON,
  SETUP_BLACKLIST_REMOVE_MODAL,
  blacklistView,
  buildBlacklistAddModal,
  buildBlacklistRemoveModal,
  type BlacklistChannelEntry,
} from './setup.ui.blacklist';

function channelEntries(guild: Guild, ids: readonly string[]): BlacklistChannelEntry[] {
  return ids.filter((id) => guild.channels.cache.has(id)).map((id) => ({ id, name: guild.channels.cache.get(id)?.name ?? id }));
}

export const blacklistRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:blacklist:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_BLACKLIST_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_BLACKLIST_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(blacklistView(channelEntries(guild, setup.blacklistedChannelIds ?? [])));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:blacklist:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_BLACKLIST_ADD_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const existing = channelEntries(guild, setup.blacklistedChannelIds ?? []);
      const remainingSlots = MAX_BLACKLISTED_CHANNELS - existing.length;
      if (remainingSlots <= 0) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `You can block up to ${MAX_BLACKLISTED_CHANNELS} channels.`));
        return;
      }
      await interaction.showModal(buildBlacklistAddModal(remainingSlots));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:blacklist:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_BLACKLIST_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const channelIds = [...interaction.fields.getSelectedChannels('channels', true, LOG_CHANNEL_TYPES).keys()];
      if (!channelIds.length) return;
      await interaction.deferUpdate();
      let updated: string[] = [];
      try {
        for (const channelId of channelIds) updated = await addBlacklistedChannel(guild.id, channelId);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not blacklist that channel.'));
      }
      await interaction.editReply(blacklistView(channelEntries(guild, updated)));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:blacklist:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_BLACKLIST_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const channels = channelEntries(guild, setup.blacklistedChannelIds ?? []);
      if (!channels.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no blacklisted channels to remove yet.'));
        return;
      }
      await interaction.showModal(buildBlacklistRemoveModal(channels));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:blacklist:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_BLACKLIST_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const channelId = interaction.fields.getStringSelectValues('channel')[0];
      if (!channelId) return;
      await interaction.deferUpdate();
      const updated = await removeBlacklistedChannel(guild.id, channelId);
      await interaction.editReply(blacklistView(channelEntries(guild, updated)));
    },
  }),
];
