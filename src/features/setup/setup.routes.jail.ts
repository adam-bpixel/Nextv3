import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_SETUP_ROLE_LIST, getJailSetup, setJailLogsChannel, setJailedRole, setJailerRoles } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_JAIL_BUTTON,
  SETUP_JAIL_JAILED_BUTTON,
  SETUP_JAIL_JAILED_MODAL,
  SETUP_JAIL_JAILER_BUTTON,
  SETUP_JAIL_JAILER_MODAL,
  SETUP_JAIL_LOGS_BUTTON,
  SETUP_JAIL_LOGS_MODAL,
  SETUP_JAIL_SAVE_BUTTON,
  buildJailLogsModal,
  buildJailedRoleModal,
  buildJailerRolesModal,
  jailView,
} from './setup.ui.jail';

async function refreshJailView(interaction: ButtonInteraction | ModalSubmitInteraction, guildId: string): Promise<void> {
  const setup = await getJailSetup(guildId);
  await interaction.editReply(jailView(setup));
}

export const jailRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:jail:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_JAIL_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_JAIL_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await refreshJailView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:jail:jailer:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_JAIL_JAILER_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildJailerRolesModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:jail:jailer:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_JAIL_JAILER_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleIds = [...(interaction.fields.getSelectedRoles('roles', false)?.keys() ?? [])].slice(0, MAX_SETUP_ROLE_LIST);
      await interaction.deferUpdate();
      await setJailerRoles(guild.id, roleIds);
      await refreshJailView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:jail:jailed:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_JAIL_JAILED_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildJailedRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:jail:jailed:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_JAIL_JAILED_MODAL,
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
      await setJailedRole(guild.id, roleId);
      await refreshJailView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:jail:logs:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_JAIL_LOGS_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildJailLogsModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:jail:logs:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_JAIL_LOGS_MODAL,
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
      await setJailLogsChannel(guild.id, channelId);
      await refreshJailView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:jail:save',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_JAIL_SAVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getJailSetup(guild.id);
      if (!setup.jailedRoleId || !setup.logsChannelId) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'Set a jailed role and a logs channel before saving.'));
        return;
      }
      const jailerLine = setup.jailerRoleIds.length
        ? setup.jailerRoleIds.map((id) => `<@&${id}>`).join(' ')
        : '*None - only Administrators can use jail commands*';
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', [
        '- Jail system saved.',
        `- Jailer roles: ${jailerLine}`,
        `- Jailed role: <@&${setup.jailedRoleId}>`,
        `- Logs channel: <#${setup.logsChannelId}>`,
      ].join('\n')));
    },
  }),
];
