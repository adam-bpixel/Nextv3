import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type APIMessageTopLevelComponent,
  type AttachmentPayload,
  type User,
} from 'discord.js';
import config from '../../core/config';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD } from '../../core/emojis';
import { permissionLabel } from '../../core/permissions';
import type { MutualGuildEntry } from './mutualGuilds';
import { renderTopmaImage } from './topmaCanvas';
import type { GuildVoiceSummary, VoiceLocation } from './voiceActivity';

export const TOPMA_MYSERVER_BUTTON_ID = 'checker:topma-myserver';

const THUMBNAIL_SIZE = 256;
const DEFAULT_THUMBNAIL = 'https://cdn.discordapp.com/embed/avatars/0.png';
const MAX_VOICE_MEMBERS_SHOWN = 20;
const MAX_LEADERBOARD_ENTRIES = 10;

export interface CheckerPage {
  components: APIMessageTopLevelComponent[];
  flags: number;
  allowedMentions: { parse: [] };
  files?: AttachmentPayload[];
}

type NavKind = 'fc' | 'cr' | 'cv';

function sep(): SeparatorBuilder {
  return new SeparatorBuilder();
}

function text(content: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(content);
}

function headerSection(content: string, thumbnailUrl: string | null): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(text(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl ?? DEFAULT_THUMBNAIL));
}

function toPage(container: ContainerBuilder): CheckerPage {
  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}

function emptyPage(title: string, body: string, thumbnailUrl: string | null): CheckerPage {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${title}`))
    .addSeparatorComponents(sep())
    .addSectionComponents(headerSection(body, thumbnailUrl));
  return toPage(container);
}

function statusOf(entry: MutualGuildEntry): string {
  if (entry.isOwner) return 'Owner';
  if (entry.isAdmin) return 'Admin';
  return entry.topRole ?? 'Member';
}

function dangerLine(entry: MutualGuildEntry): string {
  return entry.dangerous.length ? `🚩 ${entry.dangerous.map(permissionLabel).join(', ')}` : '✅ None';
}

export function navCustomId(kind: NavKind, invokerId: string, targetId: string, index: number): string {
  return `checker:${kind}:${invokerId}:${targetId}:${index}`;
}

function navRow(kind: NavKind, invokerId: string, targetId: string, index: number, total: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(navCustomId(kind, invokerId, targetId, index - 1))
      .setEmoji(ARROW_LEFT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index <= 0),
    new ButtonBuilder()
      .setCustomId(navCustomId(kind, invokerId, targetId, index))
      .setLabel(`${index + 1} / ${total}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(navCustomId(kind, invokerId, targetId, index + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index >= total - 1),
  );
}

export function fullCheckPage(user: User, entries: readonly MutualGuildEntry[], index: number, invokerId: string): CheckerPage {
  const avatar = user.displayAvatarURL({ size: THUMBNAIL_SIZE });
  if (!entries.length) {
    return emptyPage(`🔎 __Full check — ${user.tag}__`, `No shared servers found for <@${user.id}>.`, avatar);
  }

  const safeIndex = Math.min(Math.max(index, 0), entries.length - 1);
  const entry = entries.at(safeIndex);
  if (!entry) return emptyPage(`🔎 __Full check — ${user.tag}__`, `No shared servers found for <@${user.id}>.`, avatar);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# 🔎 __Full check — ${user.tag}__\n-# Across ${entries.length} shared server(s)`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `## ${entry.name}\n` +
          `- __Target user:__ <@${user.id}>\n` +
          `- __Status:__ **${statusOf(entry)}**\n` +
          `- __Nickname:__ \`${entry.nickname ?? 'None'}\`\n` +
          `- __Joined:__ ${entry.joinedAt !== null ? `<t:${entry.joinedAt}:R>` : 'Unknown'}\n` +
          `- __Members:__ \`${entry.members.toLocaleString()}\``,
        entry.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## Dangerous permissions\n${dangerLine(entry)}`));

  if (entries.length > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('fc', invokerId, user.id, safeIndex, entries.length));
  }

  return toPage(container);
}

export function rolesCheckPage(user: User, dangerous: readonly MutualGuildEntry[], index: number, invokerId: string): CheckerPage {
  const avatar = user.displayAvatarURL({ size: THUMBNAIL_SIZE });
  if (!dangerous.length) {
    return emptyPage(`🛡️ __Role check — ${user.tag}__`, `✅ No dangerous roles found for <@${user.id}> in any shared server.`, avatar);
  }

  const safeIndex = Math.min(Math.max(index, 0), dangerous.length - 1);
  const entry = dangerous.at(safeIndex);
  if (!entry) return emptyPage(`🛡️ __Role check — ${user.tag}__`, `✅ No dangerous roles found for <@${user.id}> in any shared server.`, avatar);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# 🛡️ __Role check — ${user.tag}__\n-# ${dangerous.length} flagged server(s)`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `## ${entry.name}\n` +
          `- __Target user:__ <@${user.id}>\n` +
          `- __Status:__ **${statusOf(entry)}**\n` +
          `- __Members:__ \`${entry.members.toLocaleString()}\``,
        entry.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## 🚩 Dangerous permissions\n${entry.dangerous.map(permissionLabel).join(', ')}`));

  if (dangerous.length > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('cr', invokerId, user.id, safeIndex, dangerous.length));
  }

  return toPage(container);
}

export function voiceCheckPage(user: User, locations: readonly VoiceLocation[], index: number, invokerId: string): CheckerPage {
  const avatar = user.displayAvatarURL({ size: THUMBNAIL_SIZE });
  if (!locations.length) {
    return emptyPage(`🎙️ __Voice check — ${user.tag}__`, `<@${user.id}> is not connected to any voice channel.`, avatar);
  }

  const safeIndex = Math.min(Math.max(index, 0), locations.length - 1);
  const location = locations.at(safeIndex);
  if (!location) return emptyPage(`🎙️ __Voice check — ${user.tag}__`, `<@${user.id}> is not connected to any voice channel.`, avatar);
  const shown = location.members.slice(0, MAX_VOICE_MEMBERS_SHOWN).map((id) => `- <@${id}>`);
  const more = location.members.length - shown.length;

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# 🎙️ __Voice check — ${user.tag}__\n-# Connected in ${locations.length} server(s)`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `## ${location.guildName} — ${location.channelName}\n` +
          `- __Target user:__ <@${user.id}>\n` +
          `- __Members in channel:__ \`${location.members.length}\``,
        location.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## Members\n${shown.join('\n') || 'Nobody else'}${more > 0 ? `\n-# +${more} more` : ''}`))
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

export async function topVoicePage(entries: readonly GuildVoiceSummary[]): Promise<CheckerPage> {
  const inVoice = entries.filter((entry) => entry.voice > 0);
  if (!inVoice.length) {
    return emptyPage('📈 __Top servers by voice activity__', 'Nobody is in a voice channel right now.', DEFAULT_THUMBNAIL);
  }

  const shown = inVoice.slice(0, MAX_LEADERBOARD_ENTRIES);
  const leader = shown.at(0);
  if (!leader) return emptyPage('📈 __Top servers by voice activity__', 'Nobody is in a voice channel right now.', DEFAULT_THUMBNAIL);

  const fileName = 'topma.png';
  const buffer = await renderTopmaImage(shown);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# 📈 __Top servers by voice activity__\n-# Ranked by members currently in voice'))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(`- __Leader:__ ${leader.name}\n- __In voice:__ \`${leader.voice}\`\n- __Tracked servers:__ \`${entries.length}\``, leader.iconURL),
    )
    .addSeparatorComponents(sep())
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)))
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(TOPMA_MYSERVER_BUTTON_ID).setLabel('My Server').setStyle(ButtonStyle.Secondary),
      ),
    );

  return { ...toPage(container), files: [{ attachment: buffer, name: fileName }] };
}
