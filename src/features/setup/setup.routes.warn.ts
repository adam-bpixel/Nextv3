import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_SETUP_ROLE_LIST, getWarnSetup, setFirstWarnRole, setLastWarnRole, setSecondWarnRole, setWarnLogsChannel, setWarnerRoles } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_WARN_BUTTON,
  SETUP_WARN_FIRST_BUTTON,
  SETUP_WARN_FIRST_MODAL,
  SETUP_WARN_LAST_BUTTON,
  SETUP_WARN_LAST_MODAL,
  SETUP_WARN_LOGS_BUTTON,
  SETUP_WARN_LOGS_MODAL,
  SETUP_WARN_SAVE_BUTTON,
  SETUP_WARN_SECOND_BUTTON,
  SETUP_WARN_SECOND_MODAL,
  SETUP_WARN_WARNER_BUTTON,
  SETUP_WARN_WARNER_MODAL,
  buildFirstWarnRoleModal,
  buildLastWarnRoleModal,
  buildSecondWarnRoleModal,
  buildWarnLogsModal,
  buildWarnerRolesModal,
  warnView,
} from './setup.ui.warn';

async function refreshWarnView(interaction: ButtonInteraction | ModalSubmitInteraction, guildId: string): Promise<void> {
  const setup = await getWarnSetup(guildId);
  await interaction.editReply(warnView(setup));
}

export const warnRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:warn:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_WARN_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_WARN_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await refreshWarnView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:warn:first:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_WARN_FIRST_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildFirstWarnRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:warn:first:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_WARN_FIRST_MODAL,
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
      await setFirstWarnRole(guild.id, roleId);
      await refreshWarnView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:warn:second:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_WARN_SECOND_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildSecondWarnRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:warn:second:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_WARN_SECOND_MODAL,
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
      await setSecondWarnRole(guild.id, roleId);
      await refreshWarnView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:warn:last:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_WARN_LAST_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildLastWarnRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:warn:last:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_WARN_LAST_MODAL,
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
      await setLastWarnRole(guild.id, roleId);
      await refreshWarnView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:warn:warner:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_WARN_WARNER_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildWarnerRolesModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:warn:warner:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_WARN_WARNER_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleIds = [...(interaction.fields.getSelectedRoles('roles', false)?.keys() ?? [])].slice(0, MAX_SETUP_ROLE_LIST);
      await interaction.deferUpdate();
      await setWarnerRoles(guild.id, roleIds);
      await refreshWarnView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:warn:logs:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_WARN_LOGS_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildWarnLogsModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:warn:logs:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_WARN_LOGS_MODAL,
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
      await setWarnLogsChannel(guild.id, channelId);
      await refreshWarnView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:warn:save',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_WARN_SAVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getWarnSetup(guild.id);
      if (!setup.firstWarnRoleId || !setup.secondWarnRoleId || !setup.lastWarnRoleId || !setup.logsChannelId) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'Set the first, second, and last warn roles, plus a logs channel, before saving.'));
        return;
      }
      const warnerLine = setup.warnerRoleIds.length
        ? setup.warnerRoleIds.map((id) => `<@&${id}>`).join(' ')
        : '*None - only Administrators can use warn commands*';
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', [
        '- Warn system saved.',
        `- First warn role: <@&${setup.firstWarnRoleId}>`,
        `- Second warn role: <@&${setup.secondWarnRoleId}>`,
        `- Last warn role: <@&${setup.lastWarnRoleId}>`,
        `- Warner roles: ${warnerLine}`,
        `- Logs channel: <#${setup.logsChannelId}>`,
      ].join('\n')));
    },
  }),
];
