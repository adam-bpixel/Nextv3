import { MessageFlags, type ModalSubmitInteraction, type ButtonInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { getGuildSetup, saveSelfRolePanelMeta, saveSelfRoleSettings, type SelfRolePanelInteraction, type SelfRolePanelStyle, type SelfRoleSection } from './setup.model';
import { NO_PERMISSION_TEXT, PANEL_CHANNEL_TYPES, hasManageGuild } from './setup.routes.helpers';
import {
  MAX_SELFROLE_PANEL_ROLES,
  SETUP_SELFROLE_SEND_BUTTON,
  SETUP_SELFROLE_SEND_MODAL,
  mergeSelfRoleSections,
  selfRolePanel,
} from './setup.ui.selfrole';
import { buildSelfRoleSendModal } from './setup.ui.selfrole.modals';

export const selfRolePanelRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:send:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_SELFROLE_SEND_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const setup = await getGuildSetup(guild.id);
      const sections = (setup.selfRoleSections ?? []).filter((section) => section.buttons.length > 0);
      if (!sections.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Add at least one section with roles first.'));
        return;
      }
      await interaction.showModal(buildSelfRoleSendModal(sections, setup.selfRole));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:selfrole:send:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_SELFROLE_SEND_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const sectionIds = interaction.fields.getStringSelectValues('sections');
      const channel = interaction.fields.getSelectedChannels('panel_channel', true, PANEL_CHANNEL_TYPES).first();
      const logChannel = interaction.fields.getSelectedChannels('log_channel', false, PANEL_CHANNEL_TYPES)?.first();
      const panelStyle = (interaction.fields.getStringSelectValues('panel_style')[0] ?? 'components') as SelfRolePanelStyle;
      const panelInteraction = (interaction.fields.getStringSelectValues('interaction')[0] ?? 'buttons') as SelfRolePanelInteraction;
      if (!sectionIds.length || !channel) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick at least one section and the panel channel.'));
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const setup = await getGuildSetup(guild.id);
      const allSections = setup.selfRoleSections ?? [];
      const sections = sectionIds
        .map((id) => allSections.find((candidate) => candidate.id === id))
        .filter((section): section is SelfRoleSection => Boolean(section?.buttons.length));
      if (!sections.length) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'Those sections no longer exist or have no roles.'));
        return;
      }
      const totalRoles = mergeSelfRoleSections(sections).length;
      if (totalRoles > MAX_SELFROLE_PANEL_ROLES) {
        await interaction.editReply(
          themedReplyFor(interaction.guildId, true, 'error', `The selected sections hold ${totalRoles} roles and a panel fits ${MAX_SELFROLE_PANEL_ROLES} - pick fewer sections.`),
        );
        return;
      }

      try {
        await channel.send(selfRolePanel(guild.name, guild.iconURL({ size: 256 }), sections, panelStyle, panelInteraction));
      } catch (error) {
        console.error('Sending self role panel failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', `I couldn't send the panel in <#${channel.id}> - check my permissions there.`));
        return;
      }
      await saveSelfRolePanelMeta(guild.id, sectionIds, channel.id, panelStyle, panelInteraction);
      const logChannelId = logChannel?.id ?? setup.selfRole?.logChannelId;
      await saveSelfRoleSettings(guild.id, { ...(logChannelId ? { logChannelId } : {}) });
      const names = sections.map((section) => `**${section.name}**`).join(', ');
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', `${names} panel posted in <#${channel.id}>.`));
    },
  }),
];
