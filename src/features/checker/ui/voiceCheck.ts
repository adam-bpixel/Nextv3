import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, type User } from 'discord.js';
import config from '../../../core/config';
import { SERVERS_ICON, VOICECHECK_DEAFEN_ICON, VOICECHECK_MIC_ICON, VOICECHECK_MUTE_ICON } from '../../../core/emojis';
import type { VoiceLocation, VoiceLocationMember } from '../voiceActivity';
import { type CheckerPage, THUMBNAIL_SIZE, clampIndex, headerSection, navRow, sep, text, toPage } from './shared';

const MAX_VOICE_MEMBERS_SHOWN = 20;

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
  invisible: 'Offline',
};

function statusLabel(status: string | null): string {
  if (!status) return 'Offline';
  return STATUS_LABELS[status] ?? status;
}

function voiceStateIcon(member: VoiceLocationMember): string {
  if (member.deafened) return VOICECHECK_DEAFEN_ICON;
  if (member.muted) return VOICECHECK_MUTE_ICON;
  return VOICECHECK_MIC_ICON;
}

function notConnectedPage(user: User, avatar: string): CheckerPage {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${SERVERS_ICON} __Voice check — ${user.tag}__`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(`- __Target user:__ <@${user.id}>\n- __Status:__ Not connected to any voice channel`, avatar),
    );
  return toPage(container);
}

export function voiceCheckPage(user: User, locations: readonly VoiceLocation[], index: number, invokerId: string): CheckerPage {
  const avatar = user.displayAvatarURL({ size: THUMBNAIL_SIZE });
  if (!locations.length) return notConnectedPage(user, avatar);

  const safeIndex = clampIndex(index, locations.length);
  const location = locations.at(safeIndex);
  if (!location) return notConnectedPage(user, avatar);
  const shown = location.members
    .slice(0, MAX_VOICE_MEMBERS_SHOWN)
    .map((member) => `- ${voiceStateIcon(member)} <@${member.id}> — \`${statusLabel(member.status)}\``);
  const more = location.members.length - shown.length;

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${SERVERS_ICON} __Voice check — ${user.tag}__`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `- __Server:__ ${location.guildName} — ${location.channelName}\n` +
          `- __Target user:__ <@${user.id}>\n` +
          `- __Members in channel:__ \`${location.members.length}\``,
        location.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('## Members'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`${shown.join('\n') || 'Nobody else'}${more > 0 ? `\n-# +${more} more` : ''}`))
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Jump to channel')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${location.guildId}/${location.channelId}`),
      ),
    );

  if (locations.length > 1) {
    container.addActionRowComponents(navRow('cv', invokerId, user.id, safeIndex, locations.length));
  }

  return toPage(container);
}
