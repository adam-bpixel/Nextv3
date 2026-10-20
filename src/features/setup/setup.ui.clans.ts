import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ContainerBuilder, LabelBuilder, ModalBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import type { ClanSettings } from '../clans/clans.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_CLANS_BUTTON = 'setup:clans:view:';
export const SETUP_CLANS_ROLES_BUTTON = 'setup:clans:roles';
export const SETUP_CLANS_CHANNELS_BUTTON = 'setup:clans:channels';
export const SETUP_CLANS_ROLES_MODAL = 'setup:clans:modal:roles';
export const SETUP_CLANS_CHANNELS_MODAL = 'setup:clans:modal:channels';

function clanRoleLine(label: string, roleId: string | null): string {
  return `- **${label}:** ${roleId ? `<@&${roleId}>` : 'Not set'}`;
}

function clanChannelLine(label: string, channelId: string | null): string {
  return `- **${label}:** ${channelId ? `<#${channelId}>` : 'Not set'}`;
}

export function clansSettingsView(settings: ClanSettings): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Clans'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text([
      clanRoleLine('Leader Role', settings.leaderRoleId),
      clanRoleLine('Co-Leader Role', settings.coLeaderRoleId),
      `- **Manager Roles:** ${settings.managerRoleIds.length ? settings.managerRoleIds.map((id) => `<@&${id}>`).join(', ') : 'Not set'}`,
      clanChannelLine('Voice Category', settings.voiceCategoryId),
      clanChannelLine('Log Channel', settings.logChannelId),
      clanChannelLine('Leaderboard Channel', settings.leaderboardChannelId),
    ].join('\n')));
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CLANS_ROLES_BUTTON).setLabel('Roles').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_CLANS_CHANNELS_BUTTON).setLabel('Channels').setStyle(ButtonStyle.Secondary),
    ),
  );
  return toPayload(container);
}

export function buildClansRolesModal(settings: ClanSettings): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_CLANS_ROLES_MODAL)
    .setTitle('Clan Roles')
    .addLabelComponents(
      new LabelBuilder().setLabel('Leader Role').setDescription('Given to a clan leader').setRoleSelectMenuComponent((select) => {
        select.setCustomId('leader_role').setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings.leaderRoleId) select.setDefaultRoles(settings.leaderRoleId);
        return select;
      }),
      new LabelBuilder().setLabel('Co-Leader Role').setDescription('Given to clan co-leaders').setRoleSelectMenuComponent((select) => {
        select.setCustomId('co_leader_role').setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings.coLeaderRoleId) select.setDefaultRoles(settings.coLeaderRoleId);
        return select;
      }),
      new LabelBuilder().setLabel('Manager Roles').setDescription('Roles allowed to manage clans').setRoleSelectMenuComponent((select) => {
        select.setCustomId('manager_roles').setMinValues(0).setMaxValues(5).setRequired(false);
        if (settings.managerRoleIds.length) select.setDefaultRoles(...settings.managerRoleIds);
        return select;
      }),
    );
}

export function buildClansChannelsModal(settings: ClanSettings): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_CLANS_CHANNELS_MODAL)
    .setTitle('Clan Channels')
    .addLabelComponents(
      new LabelBuilder().setLabel('Voice Category').setDescription('New clan voice channels are created here').setChannelSelectMenuComponent((select) => {
        select.setCustomId('voice_category').setChannelTypes(ChannelType.GuildCategory).setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings.voiceCategoryId) select.setDefaultChannels(settings.voiceCategoryId);
        return select;
      }),
      new LabelBuilder().setLabel('Log Channel').setDescription('Clan create, delete and edit events are logged here').setChannelSelectMenuComponent((select) => {
        select.setCustomId('log_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings.logChannelId) select.setDefaultChannels(settings.logChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Leaderboard Channel').setDescription('An auto-updating clan ranking is posted here').setChannelSelectMenuComponent((select) => {
        select.setCustomId('leaderboard_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings.leaderboardChannelId) select.setDefaultChannels(settings.leaderboardChannelId);
        return select;
      }),
    );
}
