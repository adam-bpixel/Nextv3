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
} from 'discord.js';
import config from '../../core/config';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, PREMIUM_DIAMOND_BLUE_ICON, PREMIUM_DIAMOND_GRAY_ICON, SERVERS_ICON } from '../../core/emojis';
import { discordTimestamp } from '../../core/format';

const MAX_LISTED_ROLES = 15;

export const ROLES_PER_PAGE = 10;

export interface InfoPage {
  components: APIMessageTopLevelComponent[];
  flags: number;
  allowedMentions: { parse: [] };
}

function text(content: string): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(content);
}

export function rolesNavCustomId(invokerId: string, page: number): string {
  return `info:roles:${invokerId}:${page}`;
}

function rolesNavRow(invokerId: string, page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(rolesNavCustomId(invokerId, page - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
    new ButtonBuilder().setCustomId(rolesNavCustomId(invokerId, page)).setLabel(`${page + 1} / ${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
    new ButtonBuilder()
      .setCustomId(rolesNavCustomId(invokerId, page + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

export function rolesPage(guildName: string, roleLines: readonly string[], totalRoles: number, page: number, invokerId: string): InfoPage {
  const totalPages = Math.max(1, Math.ceil(roleLines.length / ROLES_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * ROLES_PER_PAGE;
  const shown = roleLines.slice(start, start + ROLES_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${guildName} — Roles (${totalRoles})`))
    .addTextDisplayComponents(text(shown.join('\n') || 'None'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(rolesNavRow(invokerId, safePage, totalPages));

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

const STATUS_LABELS: Readonly<Record<string, string>> = { online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', invisible: 'Offline', offline: 'Offline' };

export interface UserInfoCard {
  accentColor: number;
  avatarURL: string;
  displayName: string;
  username: string;
  userId: string;
  guildName: string | null;
  guildInviteURL: string | null;
  status: string | null;
  createdTimestamp: number;
  joinedTimestamp: number | null;
  accountAgeDays: number;
  highestRoleId: string | null;
  roleIds: readonly string[];
  badgeMentions: readonly string[];
  tag: string | null;
  boostingSince: number | null;
  bannerURL: string | null;
  isPremium: boolean;
}

function userIdentityBlock(card: UserInfoCard): string {
  const lines = [
    `- __**Display Name**__ ﹕ [**${card.displayName}**](https://discord.com/users/${card.userId})`,
    `- __**Username**__ ﹕ **${card.username}**`,
    `- __**ID**__ ﹕ __${card.userId}__`,
  ];
  if (card.guildName) lines.push(`- __**Server**__ ﹕ ${card.guildInviteURL ? `[${card.guildName}](${card.guildInviteURL})` : card.guildName}`);
  if (card.status) lines.push(`- __**Status**__ ﹕ **${STATUS_LABELS[card.status] ?? card.status}**`);
  return lines.join('\n');
}

function userActivityBlock(card: UserInfoCard): string {
  const lines = [`- __**Joined Discord**__ ﹕ ${discordTimestamp(card.createdTimestamp)}`];
  if (card.joinedTimestamp !== null) lines.push(`- __**Joined Server**__ ﹕ ${discordTimestamp(card.joinedTimestamp)}`);
  lines.push(`- __**Account Age**__ ﹕ \`${card.accountAgeDays} days\``);
  if (card.highestRoleId) lines.push(`- __**Highest Role**__ ﹕ <@&${card.highestRoleId}>`);
  if (card.roleIds.length) {
    const shown = card.roleIds.slice(0, MAX_LISTED_ROLES).map((id) => `<@&${id}>`);
    const more = card.roleIds.length > MAX_LISTED_ROLES ? ` (+${card.roleIds.length - MAX_LISTED_ROLES} more)` : '';
    lines.push(`- __**Roles [${card.roleIds.length}]**__ ﹕ ${shown.join(' ')}${more}`);
  }
  return lines.join('\n');
}

function userExtrasBlock(card: UserInfoCard): string | null {
  const lines: string[] = [];
  if (card.badgeMentions.length) lines.push(`- __**Badges**__ ﹕ ${card.badgeMentions.join(' ')}`);
  if (card.tag) lines.push(`- __**Tag**__ ﹕ **${card.tag}**`);
  lines.push(`- __**Premium Status**__ ﹕ ${card.isPremium ? `${PREMIUM_DIAMOND_BLUE_ICON} **Premium**` : `${PREMIUM_DIAMOND_GRAY_ICON} **None**`}`);
  if (card.boostingSince !== null) lines.push(`- __**Boosting Since**__ ﹕ ${discordTimestamp(card.boostingSince)}`);
  return lines.length ? lines.join('\n') : null;
}

export function userInfoCard(card: UserInfoCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕ **__User Info__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(text(userIdentityBlock(card))).setThumbnailAccessory(new ThumbnailBuilder().setURL(card.avatarURL)),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(userActivityBlock(card)));

  const extras = userExtrasBlock(card);
  if (extras) container.addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(text(extras));

  const galleryURLs: [string | null, string][] = [[card.bannerURL, `${card.displayName}'s banner`]];
  const galleryItems = galleryURLs
    .filter((entry): entry is [string, string] => entry[0] !== null)
    .map(([url, description]) => new MediaGalleryItemBuilder().setURL(url).setDescription(description));

  if (galleryItems.length) {
    container.addSeparatorComponents(new SeparatorBuilder()).addMediaGalleryComponents(new MediaGalleryBuilder().addItems(...galleryItems));
  }

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface RoleInfoCard {
  accentColor: number;
  roleId: string;
  name: string;
  color: number;
  iconURL: string | null;
  position: number;
  totalRoles: number;
  memberCount: number;
  hoisted: boolean;
  mentionable: boolean;
  managed: boolean;
  createdTimestamp: number;
  permissions: readonly string[];
}

function roleIdentityBlock(card: RoleInfoCard): string {
  return [
    `- __**Name**__ ﹕ <@&${card.roleId}>`,
    `- __**ID**__ ﹕ __${card.roleId}__`,
    `- __**Color**__ ﹕ \`${card.color ? `#${card.color.toString(16).padStart(6, '0')}` : 'None'}\``,
    `- __**Position**__ ﹕ \`${card.position} / ${card.totalRoles}\``,
  ].join('\n');
}

function roleDetailsBlock(card: RoleInfoCard): string {
  return [
    `- __**Members**__ ﹕ \`${card.memberCount}\``,
    `- __**Hoisted**__ ﹕ **${card.hoisted ? 'Yes' : 'No'}**`,
    `- __**Mentionable**__ ﹕ **${card.mentionable ? 'Yes' : 'No'}**`,
    `- __**Managed**__ ﹕ **${card.managed ? 'Yes' : 'No'}**`,
    `- __**Created**__ ﹕ ${discordTimestamp(card.createdTimestamp)}`,
  ].join('\n');
}

function rolePermissionsBlock(card: RoleInfoCard): string {
  if (!card.permissions.length) return '- __**Permissions**__ ﹕ *None*';
  return [`- __**Permissions**__ ﹕`, ...card.permissions.map((permission) => `  \`${permission}\``)].join('\n');
}

export function roleInfoCard(card: RoleInfoCard): InfoPage {
  const container = new ContainerBuilder().setAccentColor(card.accentColor).addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕ **__Role Info__**`)).addSeparatorComponents(new SeparatorBuilder());

  if (card.iconURL) {
    container.addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(text(roleIdentityBlock(card))).setThumbnailAccessory(new ThumbnailBuilder().setURL(card.iconURL)),
    );
  } else {
    container.addTextDisplayComponents(text(roleIdentityBlock(card)));
  }

  container.addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(text(roleDetailsBlock(card)));
  container.addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(text(rolePermissionsBlock(card)));

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface ChannelInfoCard {
  accentColor: number;
  channelId: string;
  name: string;
  typeLabel: string;
  createdTimestamp: number;
  position: number | null;
  nsfw: boolean | null;
  parentName: string | null;
  topic: string | null;
  slowmodeSeconds: number | null;
  bitrateKbps: number | null;
  userLimit: number | null;
}

function channelIdentityBlock(card: ChannelInfoCard): string {
  const lines = [
    `- __**Name**__ ﹕ <#${card.channelId}>`,
    `- __**ID**__ ﹕ __${card.channelId}__`,
    `- __**Type**__ ﹕ \`${card.typeLabel}\``,
    `- __**Created**__ ﹕ ${discordTimestamp(card.createdTimestamp)}`,
  ];
  return lines.join('\n');
}

function channelDetailsBlock(card: ChannelInfoCard): string {
  const lines: string[] = [];
  if (card.position !== null) lines.push(`- __**Position**__ ﹕ \`${card.position}\``);
  if (card.nsfw !== null) lines.push(`- __**NSFW**__ ﹕ **${card.nsfw ? 'Yes' : 'No'}**`);
  lines.push(`- __**Parent Category**__ ﹕ ${card.parentName ? `\`${card.parentName}\`` : '*None*'}`);
  if (card.topic !== null) lines.push(`- __**Topic**__ ﹕ \`${card.topic}\``);
  if (card.slowmodeSeconds !== null) lines.push(`- __**Slowmode**__ ﹕ \`${card.slowmodeSeconds ? `${card.slowmodeSeconds}s` : 'Off'}\``);
  if (card.bitrateKbps !== null) lines.push(`- __**Bitrate**__ ﹕ \`${card.bitrateKbps}kbps\``);
  if (card.userLimit !== null) lines.push(`- __**User Limit**__ ﹕ \`${card.userLimit ? card.userLimit : 'Unlimited'}\``);
  return lines.join('\n');
}

export function channelInfoCard(card: ChannelInfoCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕ **__Channel Info__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(channelIdentityBlock(card)))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(channelDetailsBlock(card)));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface ServerInfoCard {
  accentColor: number;
  iconURL: string | null;
  bannerURL: string | null;
  name: string;
  guildId: string;
  ownerId: string;
  vanityURL: string | null;
  memberCount: number;
  botCount: number;
  textChannels: number;
  voiceChannels: number;
  categories: number;
  threads: number;
  totalChannels: number;
  roleCount: number;
  emojiCount: number;
  stickerCount: number;
  boostTier: number;
  boostCount: number;
  verificationLevel: string;
  locale: string;
  createdTimestamp: number;
}

function serverIdentityBlock(card: ServerInfoCard): string {
  const lines = [
    `- __**Server Name**__ ﹕ **${card.name}**`,
    `- __**Server ID**__ ﹕ __${card.guildId}__`,
    `- __**Owner**__ ﹕ <@${card.ownerId}>`,
    `- __**Vanity URL**__ ﹕ ${card.vanityURL ? `[${card.vanityURL}](https://${card.vanityURL})` : '*None*'}`,
  ];
  return lines.join('\n');
}

function serverStatsBlock(card: ServerInfoCard): string {
  const lines = [
    `- __**Members**__ ﹕ \`${card.memberCount}\` Total • \`${card.botCount}\` Bots`,
    `> -# __Channels:__\n> -# __Text:__ \`${card.textChannels}\`\n> -# __Voice:__ \`${card.voiceChannels}\`\n> -# __Categories:__ \`${card.categories}\`\n> -# __Threads:__ \`${card.threads}\`\n> -# __Total:__ \`${card.totalChannels}\``,
    `- __**Roles**__ ﹕ \`${card.roleCount}\``,
    `- __**Emojis**__ ﹕ \`${card.emojiCount}\``,
    `- __**Stickers**__ ﹕ \`${card.stickerCount}\``,
    `> -# __Boost Status__:\n> -# __Level:__ \`${card.boostTier}\`\n> -# __Boosts:__ \`${card.boostCount}\``,
    `- __**Verification Level**__ ﹕ **${card.verificationLevel}**`,
    `- __**Locale**__ ﹕ **${card.locale}**`,
    `- __**Server Created**__ ﹕ ${discordTimestamp(card.createdTimestamp)}`,
  ];
  return lines.join('\n');
}

export function serverInfoCard(card: ServerInfoCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕ **__Server Info__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(text(serverIdentityBlock(card)))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(card.iconURL ?? 'https://cdn.discordapp.com/embed/avatars/0.png')),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(serverStatsBlock(card)));

  if (card.bannerURL) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(card.bannerURL).setDescription(`${card.name}'s banner`)),
      );
  }

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface BotInfoCard {
  accentColor: number;
  avatarURL: string;
  bannerURL: string | null;
  botName: string;
  botId: string;
  botVersion: string;
  prefix: string;
  createdTimestamp: number | null;
  ownerId: string | null;
  servers: number;
  members: number;
  channels: number;
  uptime: string;
  ping: number;
  memoryMb: number;
  prefixCommands: number;
  slashCommands: number;
  nodeVersion: string;
  discordJsVersion: string;
  database: string;
}

function botIdentityBlock(card: BotInfoCard): string {
  const lines = [
    `- __**Bot Name**__ ﹕ **${card.botName}**`,
    `- __**Bot ID**__ ﹕ __${card.botId}__`,
    `- __**Version**__ ﹕ \`${card.botVersion}\``,
    `- __**Prefix**__ ﹕ \`${card.prefix}\``,
  ];
  if (card.createdTimestamp !== null) lines.push(`- __**Created**__ ﹕ ${discordTimestamp(card.createdTimestamp)}`);
  if (card.ownerId) lines.push(`- __**Owner**__ ﹕ <@${card.ownerId}>`);
  return lines.join('\n');
}

function botStatsBlock(card: BotInfoCard): string {
  return [
    `- __**Servers**__ ﹕ \`${card.servers}\``,
    `- __**Members**__ ﹕ \`${card.members}\``,
    `- __**Channels**__ ﹕ \`${card.channels}\``,
    `- __**Uptime**__ ﹕ \`${card.uptime}\``,
    `- __**Ping**__ ﹕ \`${card.ping}ms\``,
    `- __**Memory**__ ﹕ \`${card.memoryMb} MB\``,
  ].join('\n');
}

function botRuntimeBlock(card: BotInfoCard): string {
  return [
    `- __**Prefix Commands**__ ﹕ \`${card.prefixCommands}\``,
    `- __**Slash Commands**__ ﹕ \`${card.slashCommands}\``,
    `- __**Total Loaded**__ ﹕ \`${card.prefixCommands + card.slashCommands}\``,
    `- __**Node.js**__ ﹕ \`${card.nodeVersion}\``,
    `- __**discord.js**__ ﹕ \`${card.discordJsVersion}\``,
    `- __**Database**__ ﹕ \`${card.database}\``,
  ].join('\n');
}

export function botInfoCard(card: BotInfoCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕ **__Bot Info__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(text(botIdentityBlock(card))).setThumbnailAccessory(new ThumbnailBuilder().setURL(card.avatarURL)),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(botStatsBlock(card)))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(botRuntimeBlock(card)));

  if (card.bannerURL) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(card.bannerURL).setDescription(`${card.botName}'s banner`)),
      );
  }

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface ServerAvatarCard {
  accentColor: number;
  guildName: string;
  iconURL: string | null;
  bannerURL: string | null;
}

export function serverAvatarCard(card: ServerAvatarCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`# ${card.guildName}'s Server Avatar`))
    .addSeparatorComponents(new SeparatorBuilder());

  if (card.iconURL) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(card.iconURL).setDescription(`${card.guildName}'s icon`)),
    );
  } else {
    container.addTextDisplayComponents(text('- -# **__This server has no icon.__**'));
  }

  if (card.bannerURL) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(card.bannerURL).setDescription(`${card.guildName}'s banner`)),
      );
  }

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface BoostersCard {
  accentColor: number;
  guildName: string;
  boostTier: number;
  boostCount: number;
  boosters: readonly { userId: string; since: number }[];
}

export function boostersCard(card: BoostersCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕**__Server Boosters__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text([
      `- __**Boost Level**__ ﹕ \`${card.boostTier}\``,
      `- __**Total Boosts**__ ﹕ \`${card.boostCount}\``,
    ].join('\n')));

  container.addSeparatorComponents(new SeparatorBuilder());
  if (!card.boosters.length) {
    container.addTextDisplayComponents(text('No Boosters\nThis server currently has no boosters.'));
  } else {
    const lines = card.boosters.map((booster, index) => `${index + 1}. <@${booster.userId}> — boosting since ${discordTimestamp(booster.since)}`);
    container.addTextDisplayComponents(text(lines.join('\n')));
  }

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface VanityCheckCard {
  accentColor: number;
  guildName: string;
  queriedCode: string;
  currentCode: string | null;
  canHaveVanity: boolean;
}

export function vanityCheckCard(card: VanityCheckCard): InfoPage {
  const lines: string[] = [];
  if (!card.canHaveVanity) {
    lines.push(`- __**This server**__ ﹕ cannot have a vanity URL (requires a higher boost level).`);
  } else if (card.currentCode) {
    lines.push(`- __**This server's vanity URL**__ ﹕ \`${card.currentCode}\``);
    lines.push(
      card.currentCode.toLowerCase() === card.queriedCode.toLowerCase()
        ? `- __**Result**__ ﹕ \`${card.queriedCode}\` is **this server's own** vanity code.`
        : `- __**Result**__ ﹕ \`${card.queriedCode}\` does **not** match this server's vanity code (\`${card.currentCode}\`).`,
    );
  } else {
    lines.push(`- __**This server**__ ﹕ does not currently have a vanity URL set.`);
  }
  lines.push('', '-# Discord does not expose a public API to check vanity code availability across all servers — only your own server\'s current vanity code can be verified here.');

  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕**__Vanity URL Check__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(lines.join('\n')));

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface EmojiInfoCard {
  accentColor: number;
  name: string;
  id: string;
  animated: boolean;
  createdTimestamp: number;
  imageURL: string;
}

export function emojiInfoCard(card: EmojiInfoCard): InfoPage {
  const lines = [
    `- __**Name**__ ﹕ \`${card.name}\``,
    `- __**ID**__ ﹕ __${card.id}__`,
    `- __**Animated**__ ﹕ **${card.animated ? 'Yes' : 'No'}**`,
    `- __**Created**__ ﹕ ${discordTimestamp(card.createdTimestamp)}`,
    `- __**Image URL**__ ﹕ [Link](${card.imageURL})`,
  ];
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕**__Emoji Info__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(text(lines.join('\n'))).setThumbnailAccessory(new ThumbnailBuilder().setURL(card.imageURL)),
    );

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface FirstMessageCard {
  accentColor: number;
  channelId: string;
  authorId: string;
  authorTag: string;
  content: string;
  createdTimestamp: number;
  url: string;
}

export function firstMessageCard(card: FirstMessageCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`# First Message in <#${card.channelId}>`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text([
      `\` ⛥ - Author:\` <@${card.authorId}> (\`${card.authorTag}\`)`,
      `\` ⛥ - Sent At:\` ${discordTimestamp(card.createdTimestamp, 'f')}`,
      `\` ⛥ - Message Content:\`\n${card.content}`,
      `\` ⛥ - Jump:\` [Click to jump](${card.url})`,
    ].join('\n')));

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface GetInviteCard {
  accentColor: number;
  botTag: string;
  botId: string;
  avatarURL: string;
  inviteURL: string;
}

export function getInviteCard(card: GetInviteCard): InfoPage {
  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`### ${SERVERS_ICON} ﹕**__Bot Invite__**`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(text([
          `- __**Bot**__ ﹕ \`${card.botTag}\``,
          `- __**ID**__ ﹕ __${card.botId}__`,
          `- __**Invite**__ ﹕ [Click here to invite](${card.inviteURL})`,
        ].join('\n')))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(card.avatarURL)),
    );

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export interface InviteInfoCard {
  accentColor: number;
  guildName: string;
  guildIconURL: string | null;
  code: string;
  inviterTag: string | null;
  uses: number | null;
  maxUses: number | null;
  temporary: boolean | null;
  channelName: string | null;
  expiresTimestamp: number | null;
  inviteURL: string;
}

export function inviteInfoCard(card: InviteInfoCard): InfoPage {
  const lines = [
    `- __**Guild Name**__ ﹕ ${card.guildName}`,
    `- __**Invite Code**__ ﹕ ${card.code}`,
    `- __**Inviter**__ ﹕ ${card.inviterTag ?? 'N/A'}`,
    `- __**Max Uses**__ ﹕ ${card.maxUses && card.maxUses > 0 ? card.maxUses : 'Unlimited'}`,
    `- __**Uses**__ ﹕ ${card.uses ?? 0}`,
    `- __**Temporary**__ ﹕ ${card.temporary ? 'Yes' : 'No'}`,
    `- __**Channel**__ ﹕ ${card.channelName ?? 'Unknown'}`,
  ];
  if (card.expiresTimestamp !== null) lines.push(`- __**Expires**__ ﹕ ${discordTimestamp(card.expiresTimestamp)}`);

  const container = new ContainerBuilder()
    .setAccentColor(card.accentColor)
    .addTextDisplayComponents(text(`# Invite Info for ${card.guildName}`))
    .addSeparatorComponents(new SeparatorBuilder());

  if (card.guildIconURL) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(card.guildIconURL).setDescription(`${card.guildName} Server Icon`)),
    );
    container.addSeparatorComponents(new SeparatorBuilder());
  }

  container.addTextDisplayComponents(text(lines.join('\n')));
  container.addSeparatorComponents(new SeparatorBuilder());

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(text(`Click the button to join ${card.guildName}.`))
      .setButtonAccessory(new ButtonBuilder().setLabel(`Join ${card.guildName}`).setStyle(ButtonStyle.Link).setURL(card.inviteURL)),
  );

  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
