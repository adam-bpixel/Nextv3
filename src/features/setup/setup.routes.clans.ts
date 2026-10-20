import { ChannelType, MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { refreshClanLeaderboard, syncClanRoleAssignments } from '../clans/logic';
import { saveSettings as saveClanSettings, settingsOf as clanSettingsOf } from '../clans/clans.model';
import { NO_PERMISSION_TEXT, PANEL_CHANNEL_TYPES, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_CLANS_BUTTON,
  SETUP_CLANS_CHANNELS_BUTTON,
  SETUP_CLANS_CHANNELS_MODAL,
  SETUP_CLANS_ROLES_BUTTON,
  SETUP_CLANS_ROLES_MODAL,
  buildClansChannelsModal,
  buildClansRolesModal,
  clansSettingsView,
} from './setup.ui.clans';

export const clansRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:clans:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_CLANS_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_CLANS_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const settings = await clanSettingsOf(guild.id);
      await interaction.editReply(clansSettingsView(settings));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:clans:roles:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_CLANS_ROLES_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const settings = await clanSettingsOf(guild.id);
      await interaction.showModal(buildClansRolesModal(settings));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:clans:roles:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_CLANS_ROLES_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const leaderRoleId = interaction.fields.getSelectedRoles('leader_role', false)?.first()?.id ?? null;
      const coLeaderRoleId = interaction.fields.getSelectedRoles('co_leader_role', false)?.first()?.id ?? null;
      const managerRoleIds = [...(interaction.fields.getSelectedRoles('manager_roles', false)?.keys() ?? [])];
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const settings = await clanSettingsOf(guild.id);
      await saveClanSettings(guild.id, { ...settings, leaderRoleId, coLeaderRoleId, managerRoleIds });
      await syncClanRoleAssignments(guild);
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', 'Clan roles updated and existing clan members were synced.'));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:clans:channels:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_CLANS_CHANNELS_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const settings = await clanSettingsOf(guild.id);
      await interaction.showModal(buildClansChannelsModal(settings));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:clans:channels:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_CLANS_CHANNELS_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const voiceCategoryId = interaction.fields.getSelectedChannels('voice_category', false, [ChannelType.GuildCategory] as const)?.first()?.id ?? null;
      const logChannelId = interaction.fields.getSelectedChannels('log_channel', false, PANEL_CHANNEL_TYPES)?.first()?.id ?? null;
      const leaderboardChannelId = interaction.fields.getSelectedChannels('leaderboard_channel', false, PANEL_CHANNEL_TYPES)?.first()?.id ?? null;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const settings = await clanSettingsOf(guild.id);
      const leaderboardMessageId = leaderboardChannelId === settings.leaderboardChannelId ? settings.leaderboardMessageId : null;
      await saveClanSettings(guild.id, { ...settings, voiceCategoryId, logChannelId, leaderboardChannelId, leaderboardMessageId });
      if (leaderboardChannelId) await refreshClanLeaderboard(guild);
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', 'Clan channels updated.'));
    },
  }),
];
