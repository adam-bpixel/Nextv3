import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type APIMessageTopLevelComponent,
  type AttachmentPayload,
} from 'discord.js';
import config from '../../../core/config';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD } from '../../../core/emojis';
import { type PermissionName } from '../../../core/permissions';
import type { MutualGuildEntry } from '../mutualGuilds';

export const THUMBNAIL_SIZE = 256;
export const DEFAULT_THUMBNAIL = 'https://cdn.discordapp.com/embed/avatars/0.png';

export interface CheckerPage {
  components: APIMessageTopLevelComponent[];
  flags: number;
  allowedMentions: { parse: [] };
  files?: AttachmentPayload[];
}

export type NavKind = 'fc' | 'cr' | 'cv' | 'la' | 'lb';

export function sep(): SeparatorBuilder {
  return new SeparatorBuilder();
}

export function text(content: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(content);
}

export function headerSection(content: string, thumbnailUrl: string | null): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(text(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl ?? DEFAULT_THUMBNAIL));
}

export function toPage(container: ContainerBuilder): CheckerPage {
  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}

export function emptyPage(title: string, body: string, thumbnailUrl: string | null): CheckerPage {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${title}`))
    .addSeparatorComponents(sep())
    .addSectionComponents(headerSection(body, thumbnailUrl));
  return toPage(container);
}


export function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

export function statusOf(entry: MutualGuildEntry): string {
  if (entry.isOwner) return 'Owner';
  if (entry.isAdmin) return 'Admin';
  return entry.topRole ?? 'Member';
}

export function formatPermission(permission: PermissionName): string {
  return permission
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function navCustomId(kind: NavKind, invokerId: string, targetId: string, index: number): string {
  return `checker:${kind}:${invokerId}:${targetId}:${index}`;
}

export function navRow(kind: NavKind, invokerId: string, targetId: string, index: number, total: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(navCustomId(kind, invokerId, targetId, index - 1))
      .setEmoji(ARROW_LEFT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index <= 0),
    new ButtonBuilder()
      .setCustomId(navCustomId(kind, invokerId, targetId, index + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index >= total - 1),
  );
}
