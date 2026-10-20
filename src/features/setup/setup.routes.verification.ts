import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import {
  MAX_SETUP_ROLE_LIST,
  getVerificationSetup,
  setUnverifiedRole,
  setVerificationLogsChannel,
  setVerificatorRoles,
  setVerifiedFemaleRole,
  setVerifiedRole,
} from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_VERIFICATION_BUTTON,
  SETUP_VERIFICATION_FEMALE_BUTTON,
  SETUP_VERIFICATION_FEMALE_MODAL,
  SETUP_VERIFICATION_LOGS_BUTTON,
  SETUP_VERIFICATION_LOGS_MODAL,
  SETUP_VERIFICATION_SAVE_BUTTON,
  SETUP_VERIFICATION_UNVERIFIED_BUTTON,
  SETUP_VERIFICATION_UNVERIFIED_MODAL,
  SETUP_VERIFICATION_VERIFICATOR_BUTTON,
  SETUP_VERIFICATION_VERIFICATOR_MODAL,
  SETUP_VERIFICATION_VERIFIED_BUTTON,
  SETUP_VERIFICATION_VERIFIED_MODAL,
  buildUnverifiedRoleModal,
  buildVerificationLogsModal,
  buildVerificatorRolesModal,
  buildVerifiedFemaleRoleModal,
  buildVerifiedRoleModal,
  verificationView,
} from './setup.ui.verification';

async function refreshVerificationView(interaction: ButtonInteraction | ModalSubmitInteraction, guildId: string): Promise<void> {
  const setup = await getVerificationSetup(guildId);
  await interaction.editReply(verificationView(setup));
}

export const verificationRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:verification:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_VERIFICATION_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_VERIFICATION_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await refreshVerificationView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:verification:verified:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_VERIFICATION_VERIFIED_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildVerifiedRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:verification:verified:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_VERIFICATION_VERIFIED_MODAL,
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
      await setVerifiedRole(guild.id, roleId);
      await refreshVerificationView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:verification:female:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_VERIFICATION_FEMALE_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildVerifiedFemaleRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:verification:female:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_VERIFICATION_FEMALE_MODAL,
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
      await setVerifiedFemaleRole(guild.id, roleId);
      await refreshVerificationView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:verification:unverified:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_VERIFICATION_UNVERIFIED_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildUnverifiedRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:verification:unverified:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_VERIFICATION_UNVERIFIED_MODAL,
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
      await setUnverifiedRole(guild.id, roleId);
      await refreshVerificationView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:verification:verificator:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_VERIFICATION_VERIFICATOR_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildVerificatorRolesModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:verification:verificator:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_VERIFICATION_VERIFICATOR_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleIds = [...(interaction.fields.getSelectedRoles('roles', false)?.keys() ?? [])].slice(0, MAX_SETUP_ROLE_LIST);
      await interaction.deferUpdate();
      await setVerificatorRoles(guild.id, roleIds);
      await refreshVerificationView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:verification:logs:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_VERIFICATION_LOGS_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildVerificationLogsModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:verification:logs:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_VERIFICATION_LOGS_MODAL,
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
      await setVerificationLogsChannel(guild.id, channelId);
      await refreshVerificationView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:verification:save',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_VERIFICATION_SAVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const setup = await getVerificationSetup(guild.id);
      if (!setup.verifiedRoleId || !setup.verifiedFemaleRoleId || !setup.unverifiedRoleId || !setup.logsChannelId) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'Set the verified, female, and unverified roles, plus a logs channel, before saving.'));
        return;
      }
      const verificatorLine = setup.verificatorRoleIds.length
        ? setup.verificatorRoleIds.map((id) => `<@&${id}>`).join(' ')
        : '*None - only Administrators can verify members*';
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', [
        '- Verification system saved.',
        `- Verified role: <@&${setup.verifiedRoleId}>`,
        `- Verified female role: <@&${setup.verifiedFemaleRoleId}>`,
        `- Unverified role: <@&${setup.unverifiedRoleId}>`,
        `- Verificator roles: ${verificatorLine}`,
        `- Logs channel: <#${setup.logsChannelId}>`,
      ].join('\n')));
    },
  }),
];
