import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { getTagRole, setTagRole, syncGuildTagRole } from '../tagrole/tagrole.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_TAGROLE_BUTTON,
  SETUP_TAGROLE_MODAL,
  SETUP_TAGROLE_ROLE_BUTTON,
  SETUP_TAGROLE_STATUS_BUTTON,
  SETUP_TAGROLE_STATUS_MODAL,
  buildTagRoleModal,
  buildTagRoleStatusModal,
  tagRoleView,
} from './setup.ui.tagrole';

async function deny(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<boolean> {
  if (hasManageGuild(interaction)) return false;
  await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
  return true;
}

export const tagRoleRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:tagrole:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_TAGROLE_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_TAGROLE_BUTTON);
      if (!ownerId || (await rejectOtherUser(interaction, ownerId))) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply(tagRoleView(await getTagRole(guild.id)));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:tagrole:role:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TAGROLE_ROLE_BUTTON,
    async handle(interaction) {
      if (await deny(interaction)) return;
      await interaction.showModal(buildTagRoleModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:tagrole:role:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_TAGROLE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      const roleId = interaction.fields.getSelectedRoles('role', true).first()?.id;
      if (!roleId) return;
      const role = guild.roles.cache.get(roleId);
      if (!role || role.managed || role.id === guild.id || !role.editable) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I can't manage that role. Pick a role below my highest role."));
        return;
      }
      await interaction.deferUpdate();
      const current = await getTagRole(guild.id);
      const updated = { ...current, roleId };
      await setTagRole(guild.id, updated);
      await interaction.editReply(tagRoleView(updated));
      if (updated.enabled) void syncGuildTagRole(guild).catch(() => undefined);
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:tagrole:status:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_TAGROLE_STATUS_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      const current = await getTagRole(guild.id);
      if (!current.roleId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Set a role first.'));
        return;
      }
      await interaction.showModal(buildTagRoleStatusModal(current.enabled));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:tagrole:status:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_TAGROLE_STATUS_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      const value = interaction.fields.getStringSelectValues('status')[0];
      if (value !== 'enabled' && value !== 'disabled') return;
      const current = await getTagRole(guild.id);
      if (value === 'enabled' && !current.roleId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Set a role first.'));
        return;
      }
      await interaction.deferUpdate();
      const updated = { ...current, enabled: value === 'enabled' };
      await setTagRole(guild.id, updated);
      await interaction.editReply(tagRoleView(updated));
      if (updated.enabled) void syncGuildTagRole(guild).catch(() => undefined);
    },
  }),
];
