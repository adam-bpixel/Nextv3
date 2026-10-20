import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_CHECKER_ROLES, getCheckerRoles, setCheckerRoles } from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import { SETUP_CHECKER_BUTTON, SETUP_CHECKER_ROLES_BUTTON, SETUP_CHECKER_ROLES_MODAL, buildCheckerRolesModal, checkerView } from './setup.ui.checker';

async function refreshCheckerView(interaction: ButtonInteraction | ModalSubmitInteraction, guildId: string): Promise<void> {
  await interaction.editReply(checkerView(await getCheckerRoles(guildId)));
}

export const checkerRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:checker:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_CHECKER_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_CHECKER_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await refreshCheckerView(interaction, guild.id);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:checker:roles:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_CHECKER_ROLES_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildCheckerRolesModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:checker:roles:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_CHECKER_ROLES_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const roleIds = [...(interaction.fields.getSelectedRoles('roles', false)?.keys() ?? [])].slice(0, MAX_CHECKER_ROLES);
      await interaction.deferUpdate();
      await setCheckerRoles(guild.id, roleIds);
      await refreshCheckerView(interaction, guild.id);
    },
  }),
];
