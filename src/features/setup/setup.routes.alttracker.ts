import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { isDuration, parseDuration } from '../../core/format';
import { themedReplyFor } from '../../core/usage-replies';
import { getGuildSecurity, setAltTrackerChannel, setAltTrackerEnabled, setAltTrackerMinAge } from '../security/security.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_ALTTRACKER_BUTTON,
  SETUP_ALTTRACKER_CONFIGURE_BUTTON,
  SETUP_ALTTRACKER_CONFIGURE_MODAL,
  SETUP_ALTTRACKER_TOGGLE_BUTTON,
  altTrackerView,
  buildAltTrackerConfigureModal,
} from './setup.ui.alttracker';

export const altTrackerRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:alttracker:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_ALTTRACKER_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_ALTTRACKER_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const settings = (await getGuildSecurity(guild.id)).alttracker;
      await interaction.editReply(altTrackerView(settings));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:alttracker:configure:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_ALTTRACKER_CONFIGURE_BUTTON,
    async handle(interaction) {
      if (!interaction.guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildAltTrackerConfigureModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:alttracker:configure:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_ALTTRACKER_CONFIGURE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const channelId = interaction.fields.getSelectedChannels('channel', true).first()?.id;
      if (!channelId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick an alert channel, then submit again.'));
        return;
      }
      await interaction.deferUpdate();
      await setAltTrackerChannel(guild.id, channelId);
      const minAgeText = interaction.fields.getTextInputValue('min_age').trim();
      if (minAgeText && isDuration(minAgeText)) await setAltTrackerMinAge(guild.id, parseDuration(minAgeText, 0));
      const settings = (await getGuildSecurity(guild.id)).alttracker;
      await interaction.editReply(altTrackerView(settings));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:alttracker:toggle',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_ALTTRACKER_TOGGLE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferUpdate();
      const current = (await getGuildSecurity(guild.id)).alttracker;
      await setAltTrackerEnabled(guild.id, !current.enabled);
      const settings = (await getGuildSecurity(guild.id)).alttracker;
      await interaction.editReply(altTrackerView(settings));
    },
  }),
];
