import { ActivityType, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, type User } from 'discord.js';
import config from '../../../core/config';
import { SERVERS_ICON } from '../../../core/emojis';
import { renderActivityBanner } from '../activityBanner';
import { type CheckerPage, THUMBNAIL_SIZE, headerSection, sep, text, toPage } from './shared';

export interface DeviceStatusPayload {
  desktop?: string;
  mobile?: string;
  web?: string;
}

export interface ActivityItem {
  type: number;
  name: string;
  state?: string | null;
  details?: string | null;
  imageUrl?: string | null;
  startTimestamp?: number | null;
  endTimestamp?: number | null;
}

export interface UserPresenceData {
  status: string;
  clientStatus?: DeviceStatusPayload | null;
  activities?: readonly ActivityItem[];
}

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  idle: 'Idle / Away',
  dnd: 'Do Not Disturb',
  offline: 'Offline / Invisible',
};

function formatDeviceStatus(presence: UserPresenceData | null | undefined, devStatus?: string): string {
  if (!presence || devStatus === 'unknown') return 'Unavailable';
  if (!devStatus || devStatus === 'offline') return 'Offline';
  return `Active (${devStatus.toUpperCase()})`;
}

function formatActivityLine(a: ActivityItem): string {
  const actType = typeof a.type === 'number' ? a.type : 0;
  const actName = a.name || 'Activity';
  const actState = a.state || '';
  const actDetails = a.details ? ` | ${a.details}` : '';

  if (actType === ActivityType.Custom || actName === 'Custom Status') {
    return `- __Custom status:__ \`${actState || actName}\``;
  }
  if (actType === ActivityType.Listening || actName === 'Spotify') {
    const track = a.details || actName;
    const artist = actState ? ` by \`${actState}\`` : '';
    return `- __Listening to:__ \`${track}\`${artist}`;
  }
  if (actType === ActivityType.Streaming) {
    return `- __Streaming:__ \`${actName}\`${actDetails}`;
  }
  if (actType === ActivityType.Watching) {
    return `- __Watching:__ \`${actName}\`${actDetails}`;
  }
  if (actType === ActivityType.Competing) {
    return `- __Competing in:__ \`${actName}\`${actDetails}`;
  }
  return `- __Playing:__ \`${actName}\`${actDetails}${actState ? ` (\`${actState}\`)` : ''}`;
}

export async function activityPage(targetUser: User, presence: UserPresenceData | null | undefined): Promise<CheckerPage> {
  const avatar = targetUser.displayAvatarURL({ size: THUMBNAIL_SIZE });

  const overallStatusRaw = presence?.status;
  const overallStatus = overallStatusRaw ? STATUS_LABELS[overallStatusRaw] || overallStatusRaw : 'Unavailable';

  const clientStatus = presence?.clientStatus;
  const desktopStatus = formatDeviceStatus(presence, clientStatus?.desktop);
  const mobileStatus = formatDeviceStatus(presence, clientStatus?.mobile);
  const webStatus = formatDeviceStatus(presence, clientStatus?.web);

  const activities = presence?.activities ?? [];

  const bannerActivity =
    activities.find((activity) => activity.imageUrl && (activity.type === ActivityType.Listening || activity.name === 'Spotify')) ??
    activities.find((activity) => activity.imageUrl);

  let banner: Buffer | null = null;
  if (bannerActivity?.imageUrl) {
    const type = bannerActivity.type;
    const isListening = type === ActivityType.Listening || bannerActivity.name === 'Spotify';
    const label = isListening
      ? 'Listening to'
      : type === ActivityType.Streaming
        ? 'Streaming'
        : type === ActivityType.Watching
          ? 'Watching'
          : type === ActivityType.Competing
            ? 'Competing in'
            : 'Playing';
    const subtitle = isListening
      ? bannerActivity.state || 'Unknown artist'
      : [bannerActivity.details, bannerActivity.state].filter(Boolean).join(' · ') || label;
    const progress =
      bannerActivity.startTimestamp != null &&
      bannerActivity.endTimestamp != null &&
      bannerActivity.endTimestamp > bannerActivity.startTimestamp
        ? { start: bannerActivity.startTimestamp, end: bannerActivity.endTimestamp }
        : null;
    banner = await renderActivityBanner({
      imageUrl: bannerActivity.imageUrl,
      title: isListening ? bannerActivity.details || bannerActivity.name : bannerActivity.name,
      subtitle,
      label,
      ...(isListening ? { progress } : {}),
    });
  }

  const activityLines = presence
    ? activities.length > 0
      ? activities.map(formatActivityLine).join('\n')
      : '- `None detected`'
    : '- `Presence data unavailable`';

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${SERVERS_ICON} __Activity check — ${targetUser.tag}__`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `- __Target user:__ <@${targetUser.id}>\n` +
          `- __User ID:__ \`${targetUser.id}\`\n` +
          `- __Status:__ **${overallStatus}**`,
        avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('## Active client devices'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(
        `- __Desktop (PC / app):__ \`${desktopStatus}\`\n` +
          `- __Mobile (iOS / Android):__ \`${mobileStatus}\`\n` +
          `- __Web browser:__ \`${webStatus}\``,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('## Current activity'))
    .addSeparatorComponents(sep());

  if (banner) {
    const fileName = `activity-${targetUser.id}.png`;
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)),
    );
    return { ...toPage(container), files: [{ attachment: banner, name: fileName }] };
  }

  container.addTextDisplayComponents(text(activityLines));
  return toPage(container);
}
