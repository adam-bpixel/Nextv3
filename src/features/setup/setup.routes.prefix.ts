import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { isOwner } from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { isPremiumUser } from '../premium/premium.model';
import { getGuildPrefix, getUserPrefix, isValidPrefix, resetGuildPrefix, resetUserPrefix, setGuildPrefix, setUserPrefix } from '../prefix/prefix.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_PREFIX_BUTTON,
  SETUP_PREFIX_SELF_BUTTON,
  SETUP_PREFIX_SELF_MODAL,
  SETUP_PREFIX_SERVER_BUTTON,
  SETUP_PREFIX_SERVER_MODAL,
  buildPrefixSelfModal,
  buildPrefixServerModal,
  prefixView,
} from './setup.ui.prefix';

const PREMIUM_REQUIRED_TEXT = 'Personal prefixes need an active Premium subscription.';

async function canUseSelfPrefix(userId: string): Promise<boolean> {
  return isOwner(userId) || isPremiumUser(userId);
}

async function renderPrefixView(guildId: string, userId: string) {
  const [guildPrefix, selfPrefix, canUseSelf] = await Promise.all([getGuildPrefix(guildId), getUserPrefix(userId), canUseSelfPrefix(userId)]);
  return prefixView(guildPrefix, selfPrefix, canUseSelf);
}

export const prefixRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:prefix:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_PREFIX_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_PREFIX_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply(await renderPrefixView(guild.id, interaction.user.id));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:prefix:server:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_PREFIX_SERVER_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildPrefixServerModal(await getGuildPrefix(guild.id)));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:prefix:self:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_PREFIX_SELF_BUTTON,
    async handle(interaction) {
      if (!(await canUseSelfPrefix(interaction.user.id))) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', PREMIUM_REQUIRED_TEXT));
        return;
      }
      await interaction.showModal(buildPrefixSelfModal(await getUserPrefix(interaction.user.id)));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:prefix:server:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_PREFIX_SERVER_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const requested = interaction.fields.getTextInputValue('prefix').trim();
      if (requested.toLowerCase() === 'reset') {
        await resetGuildPrefix(guild.id);
      } else if (isValidPrefix(requested)) {
        await setGuildPrefix(guild.id, requested);
      } else {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Prefix must be 1-10 characters with no spaces.'));
        return;
      }
      await interaction.deferUpdate();
      await interaction.editReply(await renderPrefixView(guild.id, interaction.user.id));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:prefix:self:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_PREFIX_SELF_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!(await canUseSelfPrefix(interaction.user.id))) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', PREMIUM_REQUIRED_TEXT));
        return;
      }
      const requested = interaction.fields.getTextInputValue('prefix').trim();
      if (requested.toLowerCase() === 'reset') {
        await resetUserPrefix(interaction.user.id);
      } else if (isValidPrefix(requested)) {
        await setUserPrefix(interaction.user.id, requested);
      } else {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Prefix must be 1-10 characters with no spaces.'));
        return;
      }
      await interaction.deferUpdate();
      await interaction.editReply(await renderPrefixView(guild.id, interaction.user.id));
    },
  }),
];
