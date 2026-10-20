import type { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_SETUP_ROLE_LIST, getMuteSetup, setMuteLogsChannel, setMutedRole, setMuterRoles } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_MUTE_BUTTON,
  SETUP_MUTE_LOGS_BUTTON,
  SETUP_MUTE_LOGS_MODAL,
  SETUP_MUTE_MUTED_BUTTON,
  SETUP_MUTE_MUTED_MODAL,
  SETUP_MUTE_MUTER_BUTTON,
  SETUP_MUTE_MUTER_MODAL,
  SETUP_MUTE_SAVE_BUTTON,
  buildMuteLogsModal,
  buildMutedRoleModal,
  buildMuterRolesModal,
  muteView,
} from './setup.ui.mute';

async function refreshMuteView(interaction: ButtonInteraction | ModalSubmitInteraction, guildId: string): Promise<void> {
  const setup = await getMuteSetup(guildId);
  await interaction.editReply(muteView(setup));
}

export const muteRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:mute:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_MUTE_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_MUTE_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await refreshMuteView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:mute:muter:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_MUTE_MUTER_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildMuterRolesModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:mute:muter:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_MUTE_MUTER_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleIds = [...(interaction.fields.getSelectedRoles('roles', false)?.keys() ?? [])].slice(0, MAX_SETUP_ROLE_LIST);
      await interaction.deferUpdate();
      await setMuterRoles(guild.id, roleIds);
      await refreshMuteView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:mute:muted:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_MUTE_MUTED_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildMutedRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:mute:muted:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_MUTE_MUTED_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleId = interaction.fields.getSelectedRoles('role', true).first()?.id;
      if (!roleId) return;
      await interaction.deferUpdate();
      await setMutedRole(guild.id, roleId);
      await refreshMuteView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:mute:logs:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_MUTE_LOGS_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildMuteLogsModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:mute:logs:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_MUTE_LOGS_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const channelId = interaction.fields.getSelectedChannels('channel', true).first()?.id;
      if (!channelId) return;
      await interaction.deferUpdate();
      await setMuteLogsChannel(guild.id, channelId);
      await refreshMuteView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:mute:save',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_MUTE_SAVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getMuteSetup(guild.id);
      if (!setup.mutedRoleId || !setup.logsChannelId) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'Set a muted role and a logs channel before saving.'));
        return;
      }
      const muterLine = setup.muterRoleIds.length
        ? setup.muterRoleIds.map((id) => `<@&${id}>`).join(' ')
        : '*None - only Administrators can use mute commands*';
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', [
        '- Mute system saved.',
        `- Muter roles: ${muterLine}`,
        `- Muted role: <@&${setup.mutedRoleId}>`,
        `- Logs channel: <#${setup.logsChannelId}>`,
      ].join('\n')));
    },
  }),
];
