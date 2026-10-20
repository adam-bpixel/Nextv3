import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type Guild,
  type GuildBasedChannel,
  type NewsChannel,
  type StageChannel,
  type TextChannel,
  type VoiceChannel,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';

export const LOG_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

function canCreateInvite(channel: GuildBasedChannel): channel is TextChannel | NewsChannel | VoiceChannel | StageChannel {
  return (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.GuildAnnouncement ||
    channel.type === ChannelType.GuildVoice ||
    channel.type === ChannelType.GuildStageVoice
  );
}

export async function getServerInviteURL(guild: Guild): Promise<string | null> {
  if (guild.vanityURLCode) return `https://discord.gg/${guild.vanityURLCode}`;
  const channel = guild.channels.cache.find(
    (candidate): candidate is TextChannel | NewsChannel | VoiceChannel | StageChannel =>
      canCreateInvite(candidate) && (candidate.permissionsFor(guild.client.user)?.has(PermissionFlagsBits.CreateInstantInvite) ?? false),
  );
  if (!channel) return null;
  const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: false }).catch(() => null);
  return invite?.url ?? null;
}

export function serverLinkButtonRow(guildName: string, inviteURL: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel(guildName.slice(0, 80)).setStyle(ButtonStyle.Link).setURL(inviteURL),
  );
}

export const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
export const sep = (): SeparatorBuilder => new SeparatorBuilder();

export function toPayload(container: ContainerBuilder): ReplyPayload {
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2 };
}

export function card(title: string, lines: readonly string[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${title}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines.map((line) => `- ${line}`).join('\n')));
  return toPayload(container);
}

const CUSTOM_EMOJI_PATTERN = /^<(a?):([^:]+):(\d+)>$/;
const UNICODE_EMOJI_PATTERN = /^\p{Extended_Pictographic}️?$/u;

export function isValidEmojiToken(value: string): boolean {
  return CUSTOM_EMOJI_PATTERN.test(value) || UNICODE_EMOJI_PATTERN.test(value);
}

export function parsedEmoji(value: string | undefined): { id?: string; name: string; animated?: boolean } | null {
  if (!value) return null;
  const match = CUSTOM_EMOJI_PATTERN.exec(value);
  if (!match) return { name: value };
  const animated = match[1] === 'a';
  const name = match[2] ?? value;
  const id = match[3];
  return id ? { id, name, animated } : { name, animated };
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const SERVER_ICON_FALLBACK = 'https://cdn.discordapp.com/embed/avatars/0.png';

export function fillPanelTemplate(template: string, guildName: string): string {
  return template.replace(/\{server\}/g, guildName);
}

export function panelIntroSection(guildIconURL: string | null, ...contents: string[]): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(...contents.map(text))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconURL ?? SERVER_ICON_FALLBACK));
}
