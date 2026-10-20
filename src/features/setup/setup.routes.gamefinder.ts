import crypto from 'node:crypto';
import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { isDuration, parseDuration } from '../../core/format';
import { storeImage } from '../../core/image-storage';
import { themedReplyFor } from '../../core/usage-replies';
import {
  DEFAULT_GAMEFINDER_COOLDOWN_MS,
  addGame,
  getGameFinderSettings,
  removeGame,
  saveGameFinderOptions,
  type GameFinderGame,
  type GameFinderPanelStyle,
} from '../gamefinder/gamefinder.model';
import { NO_PERMISSION_TEXT, PANEL_CHANNEL_TYPES, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_GAMEFINDER_ADD_BUTTON,
  SETUP_GAMEFINDER_ADD_MODAL,
  SETUP_GAMEFINDER_BUTTON,
  SETUP_GAMEFINDER_REMOVE_BUTTON,
  SETUP_GAMEFINDER_REMOVE_MODAL,
  SETUP_GAMEFINDER_SEND_BUTTON,
  SETUP_GAMEFINDER_SETTINGS_BUTTON,
  SETUP_GAMEFINDER_SETTINGS_MODAL,
  buildGameFinderAddModal,
  buildGameFinderRemoveModal,
  buildGameFinderSettingsModal,
  gameFinderPanel,
  gameFinderView,
} from './setup.ui.gamefinder';
import { isValidEmojiToken } from './setup.ui.shared';

export const gameFinderRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:gamefinder:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_GAMEFINDER_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_GAMEFINDER_BUTTON);
      if (!ownerId || await rejectOtherUser(interaction, ownerId)) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const settings = await getGameFinderSettings(guild.id);
      await interaction.editReply(gameFinderView(settings));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:gamefinder:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_GAMEFINDER_ADD_BUTTON,
    async handle(interaction) {
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      await interaction.showModal(buildGameFinderAddModal());
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:gamefinder:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_GAMEFINDER_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const role = interaction.fields.getSelectedRoles('role', true).first();
      const name = interaction.fields.getTextInputValue('name').trim();
      const emoji = interaction.fields.getTextInputValue('emoji').trim();
      if (!role || !name) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick a role and give the game a name.'));
        return;
      }
      if (role.id === guild.id || role.managed) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "That role can't be used - it's either the default role or managed by an integration."));
        return;
      }
      if (emoji && !isValidEmojiToken(emoji)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'That emoji is not valid. Use a normal emoji or a custom one like <:name:id>.'));
        return;
      }
      await interaction.deferUpdate();
      const game: GameFinderGame = { id: crypto.randomBytes(4).toString('hex'), name, roleId: role.id, ...(emoji && { emoji }) };
      let games: GameFinderGame[];
      try {
        games = await addGame(guild.id, game);
      } catch (error) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', error instanceof Error ? error.message : 'Could not add that game.'));
        return;
      }
      const settings = await getGameFinderSettings(guild.id);
      await interaction.editReply(gameFinderView({ ...settings, games }));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:gamefinder:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_GAMEFINDER_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const settings = await getGameFinderSettings(guild.id);
      if (!settings.games.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no games to remove yet.'));
        return;
      }
      await interaction.showModal(buildGameFinderRemoveModal(settings.games));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:gamefinder:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_GAMEFINDER_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const gameId = interaction.fields.getStringSelectValues('game')[0];
      if (!gameId) return;
      await interaction.deferUpdate();
      const games = await removeGame(guild.id, gameId);
      const settings = await getGameFinderSettings(guild.id);
      await interaction.editReply(gameFinderView({ ...settings, games }));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:gamefinder:settings:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_GAMEFINDER_SETTINGS_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const settings = await getGameFinderSettings(guild.id);
      await interaction.showModal(buildGameFinderSettingsModal(settings));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:gamefinder:settings:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_GAMEFINDER_SETTINGS_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const cooldownText = interaction.fields.getTextInputValue('cooldown').trim();
      const panelChannel = interaction.fields.getSelectedChannels('panel_channel', true, PANEL_CHANNEL_TYPES).first();
      const managerRole = interaction.fields.getSelectedRoles('manager_role', false)?.first();
      const panelStyle = (interaction.fields.getStringSelectValues('panel_style')[0] ?? 'buttons') as GameFinderPanelStyle;
      const uploadedBanner = interaction.fields.getUploadedFiles('banner', false)?.first();
      if (!isDuration(cooldownText) || !panelChannel) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Enter a valid cooldown (e.g. 30m) and pick a panel channel.'));
        return;
      }
      await interaction.deferUpdate();
      let bannerURL: string | undefined;
      try {
        if (uploadedBanner) bannerURL = await storeImage(uploadedBanner.url, uploadedBanner.name || 'gamefinder-banner.png');
      } catch (error) {
        console.error('Storing game finder banner failed:', error);
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'The banner could not be saved. Check the webhook URL and make sure the image is under 8 MB.'));
        return;
      }
      const current = await getGameFinderSettings(guild.id);
      const settings = await saveGameFinderOptions(guild.id, {
        cooldownMs: parseDuration(cooldownText, DEFAULT_GAMEFINDER_COOLDOWN_MS),
        panelChannelId: panelChannel.id,
        managerRoleId: managerRole?.id ?? null,
        panelStyle,
        ...((bannerURL ?? current.bannerURL) ? { bannerURL: bannerURL ?? current.bannerURL } : {}),
      });
      await interaction.editReply(gameFinderView(settings));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:gamefinder:send:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_GAMEFINDER_SEND_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const settings = await getGameFinderSettings(guild.id);
      if (!settings.games.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Add at least one game first.'));
        return;
      }
      if (!settings.panelChannelId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Set the panel channel in Settings first.'));
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const channel = await guild.channels.fetch(settings.panelChannelId).catch(() => null);
      if (!channel?.isTextBased() || !channel.isSendable()) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', "I can't send messages in the configured panel channel - check my permissions."));
        return;
      }
      try {
        await channel.send(gameFinderPanel(settings.games, settings.panelStyle, settings.bannerURL));
      } catch (error) {
        console.error('Sending game finder panel failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', `I couldn't send the panel in <#${channel.id}> - check my permissions there.`));
        return;
      }
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', `Game Finder panel posted in <#${channel.id}>.`));
    },
  }),
];
