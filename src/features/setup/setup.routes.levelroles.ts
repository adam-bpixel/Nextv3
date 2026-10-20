import { MessageFlags, type ButtonInteraction, type Guild, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import {
  MAX_LEVEL_ROLES,
  MAX_LEVEL_ROLE_LEVEL,
  MIN_LEVEL_ROLE_LEVEL,
  addLevelRole,
  getGuildSetup,
  removeLevelRole,
  type LevelKind,
  type LevelRoleEntry,
} from './setup.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_LEVELROLES_ADD_BUTTON,
  SETUP_LEVELROLES_ADD_MODAL,
  SETUP_LEVELROLES_BUTTON,
  SETUP_LEVELROLES_REMOVE_BUTTON,
  SETUP_LEVELROLES_REMOVE_MODAL,
  buildLevelRoleAddModal,
  buildLevelRoleRemoveModal,
  levelRolesView,
  type LevelRoleView,
} from './setup.ui.levelroles';

function toView(guild: Guild, entries: readonly LevelRoleEntry[]): LevelRoleView[] {
  return entries
    .filter((entry) => guild.roles.cache.has(entry.roleId))
    .map((entry) => ({ id: entry.id, roleId: entry.roleId, roleName: guild.roles.cache.get(entry.roleId)?.name ?? entry.roleId, level: entry.level, kind: entry.kind }));
}

export const levelRolesRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:levelroles:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_LEVELROLES_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_LEVELROLES_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = await getGuildSetup(guild.id);
      await interaction.editReply(levelRolesView(toView(guild, setup.levelRoles ?? [])));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:levelroles:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_LEVELROLES_ADD_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      if ((setup.levelRoles ?? []).length >= MAX_LEVEL_ROLES) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `You can add up to ${MAX_LEVEL_ROLES} level roles.`));
        return;
      }
      await interaction.showModal(buildLevelRoleAddModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:levelroles:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_LEVELROLES_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const role = interaction.fields.getSelectedRoles('role', true).first();
      const levelRaw = interaction.fields.getTextInputValue('level').trim();
      const kind = (interaction.fields.getStringSelectValues('kind')[0] ?? 'chat') as LevelKind;
      if (!role) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick a role.'));
        return;
      }
      const level = Number(levelRaw);
      if (!/^\d+$/.test(levelRaw) || level < MIN_LEVEL_ROLE_LEVEL || level > MAX_LEVEL_ROLE_LEVEL) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', `Level must be a number between ${MIN_LEVEL_ROLE_LEVEL} and ${MAX_LEVEL_ROLE_LEVEL}.`));
        return;
      }
      if (role.id === guild.id || role.managed) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "That role can't be used - it's either the default role or managed by an integration."));
        return;
      }
      await interaction.deferUpdate();
      let entries;
      try {
        entries = await addLevelRole(guild.id, { roleId: role.id, level, kind });
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that level role.'));
        return;
      }
      await interaction.editReply(levelRolesView(toView(guild, entries)));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:levelroles:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_LEVELROLES_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const entries = toView(guild, setup.levelRoles ?? []);
      if (!entries.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no level roles to remove yet.'));
        return;
      }
      await interaction.showModal(buildLevelRoleRemoveModal(entries));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:levelroles:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_LEVELROLES_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const id = interaction.fields.getStringSelectValues('entry')[0];
      if (!id) return;
      await interaction.deferUpdate();
      const entries = await removeLevelRole(guild.id, id);
      await interaction.editReply(levelRolesView(toView(guild, entries)));
    },
  }),
];
