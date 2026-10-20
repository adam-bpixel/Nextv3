import { ChannelType, PermissionFlagsBits, type ButtonInteraction, type ModalSubmitInteraction, type StringSelectMenuInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { permissionBit } from '../../core/permissions';
import { themedReplyFor } from '../../core/usage-replies';
import { categoryOf, getGuildLogsConfig, setLogEventChannel, setLogEventEnabled, forgetGuildLogs } from './logs.model';
import { buildLogsChannelModal, logsCategoryView, logsOverviewView, SETUP_LOGS_BACK_BUTTON, SETUP_LOGS_BUTTON, SETUP_LOGS_CATEGORY_SELECT, SETUP_LOGS_CHANNEL_PREFIX, SETUP_LOGS_MODAL_PREFIX, SETUP_LOGS_TOGGLE_PREFIX } from './logs.ui';

const NO_PERMISSION_TEXT = 'You need the Manage Server permission to configure this.';
const LOG_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

function ownerFromSuffix(customId: string, prefix: string): string | null {
  const ownerId = customId.slice(prefix.length);
  return /^\d{15,22}$/.test(ownerId) ? ownerId : null;
}

async function rejectOtherUser(interaction: ButtonInteraction, ownerId: string): Promise<boolean> {
  if (interaction.user.id === ownerId) return false;
  await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${ownerId}> can use this setup panel.`));
  return true;
}

function hasManageGuild(interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction): boolean {
  return interaction.memberPermissions?.has(permissionBit('manage_guild')) ?? false;
}

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:logs:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_LOGS_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_LOGS_BUTTON);
      if (!ownerId || (await rejectOtherUser(interaction, ownerId))) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const config = await getGuildLogsConfig(guild.id);
      await interaction.reply(logsOverviewView(config));
    },
  }),

  defineRoute<StringSelectMenuInteraction>({
    name: 'setup:logs:category:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId === SETUP_LOGS_CATEGORY_SELECT,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const category = categoryOf(interaction.values[0] ?? '');
      if (!category) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That log category no longer exists.'));
        return;
      }
      const config = await getGuildLogsConfig(guild.id);
      await interaction.reply(logsCategoryView(category, config));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:logs:back',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_LOGS_BACK_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      await interaction.deferUpdate();
      const config = await getGuildLogsConfig(guild.id);
      await interaction.editReply(logsOverviewView(config));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:logs:channel:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_LOGS_CHANNEL_PREFIX),
    async handle(interaction) {
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const category = categoryOf(interaction.customId.slice(SETUP_LOGS_CHANNEL_PREFIX.length));
      if (!category) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That log category no longer exists.'));
        return;
      }
      await interaction.showModal(buildLogsChannelModal(category));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:logs:channel:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_LOGS_MODAL_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const category = categoryOf(interaction.customId.slice(SETUP_LOGS_MODAL_PREFIX.length));
      if (!category) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'That log category no longer exists.'));
        return;
      }
      const eventKeys = interaction.fields.getStringSelectValues('events').filter((key) => category.events.some((event) => event.key === key));
      const channel = interaction.fields.getSelectedChannels('channel', true, LOG_CHANNEL_TYPES).first();
      if (!eventKeys.length || !channel) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'usage', 'Pick at least one event and a channel.'));
        return;
      }
      const botMember = guild.members.me;
      const me = botMember ? channel.permissionsFor(botMember) : null;
      if (!me?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `I can't send messages in <#${channel.id}> - give me View Channel and Send Messages there.`));
        return;
      }
      await interaction.deferUpdate();
      const updated = await setLogEventChannel(guild.id, eventKeys, channel.id);
      forgetGuildLogs(guild.id);
      await interaction.editReply(logsCategoryView(category, updated));
    },
  }),

  defineRoute<StringSelectMenuInteraction>({
    name: 'setup:logs:toggle',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId.startsWith(SETUP_LOGS_TOGGLE_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
        return;
      }
      const category = categoryOf(interaction.customId.slice(SETUP_LOGS_TOGGLE_PREFIX.length));
      const eventKey = interaction.values[0];
      if (!category || !eventKey) return;
      await interaction.deferUpdate();
      const current = await getGuildLogsConfig(guild.id);
      const setting = current.events[eventKey];
      if (!setting) {
        await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'That event has no channel yet - set one first.'));
        return;
      }
      const updated = await setLogEventEnabled(guild.id, eventKey, !setting.enabled);
      forgetGuildLogs(guild.id);
      await interaction.editReply(logsCategoryView(category, updated));
    },
  }),
];
