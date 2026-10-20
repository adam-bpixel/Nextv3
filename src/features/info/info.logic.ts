import fs from 'node:fs';
import path from 'node:path';
import {
  ChannelType,
  ContainerBuilder,
  EmbedBuilder,
  GuildVerificationLevel,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  OAuth2Scopes,
  PermissionFlagsBits,
  SeparatorBuilder,
  TextDisplayBuilder,
  version as discordJsVersion,
} from 'discord.js';
import { asBotClient } from '../../core/client';
import config from '../../core/config';
import { discordTimestamp, formatDuration } from '../../core/format';
import { requireGuild } from '../../core/replies';
import { toSnakeCase } from '../../core/permissions';
import type { CommandHandler } from '../../core/types';
import { resolveBadgeEmojiMentions } from '../profile/badgeEmojis';
import { fetchUserProfileBadges } from '../profile/badges';
import { cachedColor } from '../theme/theme.model';
import { checkerApiPing, isConfigured as isCheckerApiConfigured } from '../checker/selfbot';
import { isPremiumUser } from '../premium/premium.model';
import { renderServerStatsCard } from '../checker/canvas/serverstats';
import {
  boostersCard,
  botInfoCard,
  channelInfoCard,
  emojiInfoCard,
  firstMessageCard,
  getInviteCard,
  inviteInfoCard,
  roleInfoCard,
  rolesPage,
  serverAvatarCard,
  serverInfoCard,
  userInfoCard,
  vanityCheckCard,
} from './info.ui';
import { serverStatsPage } from './serverStats.ui';
import { errorReply, usageReply } from '../../core/usage-replies';
import { parsedEmoji } from '../setup/setup.ui.shared';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const LARGE_AVATAR = 1024;
const THUMBNAIL_SIZE = 256;
const BANNER_SIZE = 1024;

const EMBED_CODE_METHOD = /\.(setTitle|setDescription|setURL|setThumbnail|setImage|setColor)\s*\(\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|0x[\da-f]+|\d+)\s*\)/gi;
const EMBED_CODE_FOOTER = /\.setFooter\s*\(\s*\{\s*text\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*\}\s*\)/gi;

function codeString(value: string): string {
  if (value.startsWith('"')) return JSON.parse(value) as string;
  return value.slice(1, -1).replace(/\\(['\\nrt])/g, (_match, escaped: string) => {
    const replacements: Readonly<Record<string, string>> = { "'": "'", '\\': '\\', n: '\n', r: '\r', t: '\t' };
    return replacements[escaped] ?? escaped;
  });
}

function embedFromCode(input: string, botName: string): EmbedBuilder | null {
  let source = input.trim().replace(/^```(?:js|javascript|ts|typescript)?\s*/i, '').replace(/\s*```$/, '');
  source = source.replace(/^(?:(?:const|let|var)\s+\w+\s*=\s*)?new\s+EmbedBuilder\s*\(\s*\)/, '');
  if (source === input.trim()) return null;

  const embed = new EmbedBuilder();
  let applied = 0;
  source = source.replace(EMBED_CODE_METHOD, (_call, method: string, rawValue: string) => {
    const value = rawValue.startsWith('0x') || /^\d+$/.test(rawValue) ? Number(rawValue) : codeString(rawValue);
    switch (method.toLowerCase()) {
      case 'settitle': embed.setTitle(String(value)); break;
      case 'setdescription': embed.setDescription(String(value)); break;
      case 'seturl': embed.setURL(String(value)); break;
      case 'setthumbnail': embed.setThumbnail(String(value)); break;
      case 'setimage': embed.setImage(String(value)); break;
      case 'setcolor': embed.setColor(value as number | `#${string}`); break;
    }
    applied += 1;
    return '';
  });
  source = source.replace(EMBED_CODE_FOOTER, (_call, rawText: string) => {
    embed.setFooter({ text: codeString(rawText) });
    applied += 1;
    return '';
  });
  source = source.replace(/\.setTimestamp\s*\(\s*\)/gi, () => {
    embed.setTimestamp();
    applied += 1;
    return '';
  });
  if (!applied || source.replace(/[\s;]+/g, '')) return null;
  if (!embed.data.footer) embed.setFooter({ text: botName });
  return embed;
}

function embedCodeUsage(botName: string, prefix: string): string {
  return [
    `Create an embed with ${botName}:`,
    '```js',
    'const embed = new EmbedBuilder()',
    '  .setTitle("Title")',
    '  .setDescription("Description")',
    '  .setColor(0x5865F2)',
    '```',
    `Run it with \`${prefix}embed <code>\`.`,
  ].join('\n');
}

function readBotVersion(): string {
  try {
    const raw = fs.readFileSync(path.join(config.root, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const BOT_VERSION = readBotVersion();

const INVITE_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.Connect,
];

export const infoLogic = {
  async embed(ctx) {
    const botName = ctx.client.user?.username ?? config.botName;
    const embed = embedFromCode(ctx.text, botName);
    if (!embed) {
      await ctx.send(usageReply(ctx, embedCodeUsage(botName, ctx.prefix)));
      return 'completed';
    }
    await ctx.send({ embeds: [embed.toJSON()], allowedMentions: { parse: [] } });
    return 'completed';
  },

  async ping(ctx) {
    const latency = Date.now() - ctx.createdTimestamp;
    const checkerPing = checkerApiPing();
    const checkerStatus = !isCheckerApiConfigured() ? 'Not configured' : checkerPing === null ? 'Unavailable' : `${Math.round(checkerPing)}ms`;
    const botName = ctx.client.user?.username ?? config.botName;
    const container = new ContainerBuilder()
      .setAccentColor(ctx.guild ? cachedColor(ctx.guild.id) ?? config.color : config.color)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Pong!'))
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `- __**Response**__ · \`${latency}ms\``,
        `- __**Discord API**__ · \`${Math.round(ctx.client.ws.ping)}ms\``,
        `- __**Checker API**__ · \`${checkerStatus}\``,
      ].join('\n')))
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# © ${new Date().getFullYear()} ${botName} All rights reserved`));

    await ctx.send({
      components: [container.toJSON()],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
    return 'completed';
  },

  async avatar(ctx) {
    const target = await ctx.targetUser();
    const user = await ctx.client.users.fetch(target.id, { force: true }).catch(() => target);
    const avatarURL = user.displayAvatarURL({ size: LARGE_AVATAR });
    const container = new ContainerBuilder()
      .setAccentColor(ctx.guild ? cachedColor(ctx.guild.id) ?? config.color : config.color)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# <@${user.id}>'s Avatar`))
      .addSeparatorComponents(new SeparatorBuilder())
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(avatarURL).setDescription(`${user.username}'s avatar`)),
      );

    await ctx.send({
      components: [container.toJSON()],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
    return 'completed';
  },

  async banner(ctx) {
    const target = await ctx.targetUser();
    const user = await ctx.client.users.fetch(target.id, { force: true }).catch(() => target);
    const bannerURL = user.bannerURL({ size: BANNER_SIZE });
    const container = new ContainerBuilder()
      .setAccentColor(ctx.guild ? cachedColor(ctx.guild.id) ?? config.color : config.color)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# <@${user.id}>'s Banner`))
      .addSeparatorComponents(new SeparatorBuilder());

    if (bannerURL) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerURL).setDescription(`${user.username}'s banner`)),
      );
    } else {
      await ctx.send(errorReply(ctx, `- ${user.username} does not have a banner.`));
      return 'completed';
    }

    await ctx.send({
      components: [container.toJSON()],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
    return 'completed';
  },

  async userinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const targetUser = await ctx.targetUser();
    const [user, member] = await Promise.all([
      ctx.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser),
      guild.members.fetch(targetUser.id).catch(() => null),
    ]);
    const [badges, isPremium] = await Promise.all([fetchUserProfileBadges(user), isPremiumUser(user.id)]);
    const badgeMentions = await resolveBadgeEmojiMentions(ctx.client, badges.map((badge) => badge.id));

    const everyoneRoleId = guild.id;
    const roleIds = member
      ? [...member.roles.cache.values()]
          .filter((role) => role.id !== everyoneRoleId)
          .sort((a, b) => b.position - a.position)
          .map((role) => role.id)
      : [];
    const highestRoleId = member && member.roles.highest.id !== everyoneRoleId ? member.roles.highest.id : null;

    await ctx.send(
      userInfoCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        avatarURL: member?.displayAvatarURL({ size: THUMBNAIL_SIZE }) ?? user.displayAvatarURL({ size: THUMBNAIL_SIZE }),
        displayName: member?.displayName ?? user.globalName ?? user.username,
        username: user.username,
        userId: user.id,
        guildName: guild.name,
        guildInviteURL: guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : null,
        status: member?.presence?.status ?? null,
        createdTimestamp: user.createdTimestamp,
        joinedTimestamp: member?.joinedTimestamp ?? null,
        accountAgeDays: Math.floor((Date.now() - user.createdTimestamp) / MS_PER_DAY),
        highestRoleId,
        roleIds,
        badgeMentions,
        tag: user.primaryGuild?.identityEnabled ? user.primaryGuild.tag : null,
        boostingSince: member?.premiumSince?.getTime() ?? null,
        bannerURL: user.bannerURL({ size: BANNER_SIZE }) ?? null,
        isPremium,
      }),
    );
    return 'completed';
  },

  async roleinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';

    const raw = ctx.args[0]?.replace(/[<@&>]/g, '');
    if (!raw) {
      await ctx.send(usageReply(ctx, `Give a role mention or ID. Usage: \`${ctx.prefix}roleinfo <role>\`.`));
      return 'skipped';
    }

    await guild.roles.fetch().catch(() => undefined);
    const role = guild.roles.cache.get(raw) ?? guild.roles.cache.find((r) => r.name.toLowerCase() === raw.toLowerCase());
    if (!role) {
      await ctx.send(errorReply(ctx, 'Role not found.'));
      return 'skipped';
    }

    const sorted = [...guild.roles.cache.values()].sort((a, b) => b.position - a.position);
    const position = sorted.findIndex((r) => r.id === role.id) + 1;

    await ctx.send(
      roleInfoCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        roleId: role.id,
        name: role.name,
        color: role.color,
        iconURL: role.iconURL({ size: THUMBNAIL_SIZE }),
        position,
        totalRoles: sorted.length,
        memberCount: role.members.size,
        hoisted: role.hoist,
        mentionable: role.mentionable,
        managed: role.managed,
        createdTimestamp: role.createdTimestamp,
        permissions: role.permissions.toArray().map((flag) => toSnakeCase(flag).split('_').map((word) => word[0]!.toUpperCase() + word.slice(1)).join(' ')),
      }),
    );
    return 'completed';
  },

  async channelinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';

    const raw = ctx.args[0]?.replace(/[<#>]/g, '');
    const found = raw ? (guild.channels.cache.get(raw) ?? await guild.channels.fetch(raw).catch(() => null)) : ctx.channel;
    if (!found || !('guild' in found) || found.guild.id !== guild.id) {
      await ctx.send(errorReply(ctx, 'Channel not found.'));
      return 'skipped';
    }
    const channel = found;

    const typeLabels: Partial<Record<ChannelType, string>> = {
      [ChannelType.GuildText]: 'Text',
      [ChannelType.GuildVoice]: 'Voice',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildAnnouncement]: 'Announcement',
      [ChannelType.GuildStageVoice]: 'Stage',
      [ChannelType.GuildForum]: 'Forum',
      [ChannelType.GuildMedia]: 'Media',
      [ChannelType.PublicThread]: 'Thread',
      [ChannelType.PrivateThread]: 'Private Thread',
      [ChannelType.AnnouncementThread]: 'Announcement Thread',
    };

    const asRecord = channel as unknown as Record<string, unknown>;
    const bitrate = asRecord.bitrate;
    await ctx.send(
      channelInfoCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        channelId: channel.id,
        name: typeof asRecord.name === 'string' ? asRecord.name : channel.id,
        typeLabel: typeLabels[channel.type] ?? 'Unknown',
        createdTimestamp: channel.createdTimestamp ?? Date.now(),
        position: typeof asRecord.position === 'number' ? asRecord.position : null,
        nsfw: typeof asRecord.nsfw === 'boolean' ? asRecord.nsfw : null,
        parentName: 'parent' in channel ? (channel.parent?.name ?? null) : null,
        topic: typeof asRecord.topic === 'string' ? asRecord.topic : null,
        slowmodeSeconds: typeof asRecord.rateLimitPerUser === 'number' ? asRecord.rateLimitPerUser : null,
        bitrateKbps: typeof bitrate === 'number' ? Math.round(bitrate / 1000) : null,
        userLimit: typeof asRecord.userLimit === 'number' ? asRecord.userLimit : null,
      }),
    );
    return 'completed';
  },

  async serverinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const botCount = members.filter((member) => member.user.bot).size;

    const channels = guild.channels.cache;
    const textChannels = channels.filter((channel) => channel.type === ChannelType.GuildText).size;
    const voiceChannels = channels.filter((channel) => channel.type === ChannelType.GuildVoice).size;
    const categories = channels.filter((channel) => channel.type === ChannelType.GuildCategory).size;
    const threads = channels.filter((channel) => channel.isThread()).size;

    const verificationLabels: Record<GuildVerificationLevel, string> = {
      [GuildVerificationLevel.None]: 'None',
      [GuildVerificationLevel.Low]: 'Low',
      [GuildVerificationLevel.Medium]: 'Medium',
      [GuildVerificationLevel.High]: 'High',
      [GuildVerificationLevel.VeryHigh]: 'Very High',
    };

    await ctx.send(
      serverInfoCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        iconURL: guild.iconURL({ size: THUMBNAIL_SIZE }),
        bannerURL: guild.bannerURL({ size: BANNER_SIZE }),
        name: guild.name,
        guildId: guild.id,
        ownerId: guild.ownerId,
        vanityURL: guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : null,
        memberCount: guild.memberCount,
        botCount,
        textChannels,
        voiceChannels,
        categories,
        threads,
        totalChannels: channels.size,
        roleCount: guild.roles.cache.filter((role) => role.id !== guild.id).size,
        emojiCount: guild.emojis.cache.size,
        stickerCount: guild.stickers.cache.size,
        boostTier: Number(guild.premiumTier),
        boostCount: guild.premiumSubscriptionCount ?? 0,
        verificationLevel: verificationLabels[guild.verificationLevel],
        locale: guild.preferredLocale,
        createdTimestamp: guild.createdTimestamp,
      }),
    );
    return 'completed';
  },

  async serverStats(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const botCount = members.filter((member) => member.user.bot).size;
    const channels = guild.channels.cache;

    const buffer = await renderServerStatsCard({
      guildName: guild.name,
      iconURL: guild.iconURL({ size: THUMBNAIL_SIZE }),
      memberCount: guild.memberCount,
      humanCount: guild.memberCount - botCount,
      botCount,
      voiceNow: guild.voiceStates.cache.size,
      textChannels: channels.filter((channel) => channel.type === ChannelType.GuildText).size,
      voiceChannels: channels.filter((channel) => channel.type === ChannelType.GuildVoice).size,
      roleCount: guild.roles.cache.filter((role) => role.id !== guild.id).size,
      boostCount: guild.premiumSubscriptionCount ?? 0,
      boostTier: Number(guild.premiumTier),
    });

    await ctx.send(serverStatsPage(guild.name, cachedColor(guild.id) ?? config.color, buffer));
    return 'completed';
  },

  async membercount(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await ctx.send(ctx.embed({ title: 'Members', description: `**${guild.memberCount}** members` }));
    return 'completed';
  },

  async uptime(ctx) {
    const uptime = ctx.client.uptime ?? 0;
    await ctx.send(ctx.embed({ title: 'Uptime', description: `Online for **${formatDuration(uptime)}** (since ${discordTimestamp(Date.now() - uptime, 'f')})` }));
    return 'completed';
  },

  async botinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const client = asBotClient(ctx.client);
    const clientUser = client.user;
    const botUser = clientUser ? await clientUser.fetch().catch(() => clientUser) : null;
    const botName = botUser?.username ?? config.botName;
    const members = client.guilds.cache.reduce((total, g) => total + g.memberCount, 0);
    const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    const prefixCommands = client.commands.size;
    const slashCommands = client.slashCommands.size;

    await ctx.send(
      botInfoCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        avatarURL: botUser?.displayAvatarURL({ size: THUMBNAIL_SIZE }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
        bannerURL: botUser?.bannerURL({ size: BANNER_SIZE }) ?? null,
        botName,
        botId: botUser?.id ?? 'Unknown',
        botVersion: BOT_VERSION,
        prefix: ctx.prefix,
        createdTimestamp: botUser?.createdTimestamp ?? null,
        ownerId: config.ownerId || null,
        servers: client.guilds.cache.size,
        members,
        channels: client.channels.cache.size,
        uptime: formatDuration(client.uptime ?? 0),
        ping: Math.round(client.ws.ping),
        memoryMb,
        prefixCommands,
        slashCommands,
        nodeVersion: process.version,
        discordJsVersion,
        database: config.mongoUri ? 'MongoDB' : 'Local JSON',
      }),
    );
    return 'completed';
  },

  async roles(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await guild.members.fetch().catch(() => undefined);
    const roles = [...guild.roles.cache.values()].filter((role) => role.id !== guild.id).sort((a, b) => b.position - a.position);
    const lines = roles.map((role) => `<@&${role.id}> — \`${role.members.size}\` members`);
    await ctx.send(rolesPage(guild.name, lines, roles.length, 0, ctx.user.id));
    return 'completed';
  },

  async invite(ctx) {
    const url = ctx.client.generateInvite({ scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands], permissions: INVITE_PERMISSIONS });
    await ctx.send(ctx.embed({ title: 'Invite me', description: `[Click here to add me to your server](${url})` }));
    return 'completed';
  },

  async avatarserver(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await ctx.send(
      serverAvatarCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        guildName: guild.name,
        iconURL: guild.iconURL({ size: BANNER_SIZE }),
        bannerURL: guild.bannerURL({ size: BANNER_SIZE }),
      }),
    );
    return 'completed';
  },

  async boosters(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const boosters = [...members.values()]
      .filter((member) => member.premiumSince !== null)
      .sort((a, b) => (a.premiumSince?.getTime() ?? 0) - (b.premiumSince?.getTime() ?? 0))
      .map((member) => ({ userId: member.id, since: member.premiumSince!.getTime() }));

    await ctx.send(
      boostersCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        guildName: guild.name,
        boostTier: Number(guild.premiumTier),
        boostCount: guild.premiumSubscriptionCount ?? 0,
        boosters,
      }),
    );
    return 'completed';
  },

  async checkVanity(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const code = ctx.args[0];
    if (!code) {
      await ctx.send(usageReply(ctx, `Give a vanity URL code to check. Usage: \`${ctx.prefix}check-vanity <code>\`.`));
      return 'skipped';
    }

    // Discord does not expose a public API to check vanity-code availability across all
    // servers. We can only compare against this server's own current vanity code.
    const canHaveVanity = guild.features.includes('VANITY_URL');
    await ctx.send(
      vanityCheckCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        guildName: guild.name,
        queriedCode: code,
        currentCode: guild.vanityURLCode,
        canHaveVanity,
      }),
    );
    return 'completed';
  },

  async emojiinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const raw = ctx.args[0];
    if (!raw) {
      await ctx.send(usageReply(ctx, `Give a custom emoji, name, or ID. Usage: \`${ctx.prefix}emojiinfo <emoji>\`.`));
      return 'skipped';
    }

    const parsed = parsedEmoji(raw);
    if (!parsed?.id) {
      await ctx.send(errorReply(ctx, 'That looks like a unicode emoji — unicode emojis have no ID or image asset to show info for.'));
      return 'skipped';
    }

    await guild.emojis.fetch().catch(() => undefined);
    const emoji = guild.emojis.cache.get(parsed.id)
      ?? guild.emojis.cache.find((e) => e.name?.toLowerCase() === parsed.name.toLowerCase());
    if (!emoji) {
      await ctx.send(errorReply(ctx, 'Emoji not found in this server.'));
      return 'skipped';
    }

    await ctx.send(
      emojiInfoCard({
        accentColor: cachedColor(guild.id) ?? config.color,
        name: emoji.name ?? 'unknown',
        id: emoji.id,
        animated: Boolean(emoji.animated),
        createdTimestamp: emoji.createdTimestamp ?? Date.now(),
        imageURL: emoji.imageURL({ size: THUMBNAIL_SIZE }) ?? `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`,
      }),
    );
    return 'completed';
  },

  async firstmsg(ctx) {
    const raw = ctx.args[0]?.replace(/[<#>]/g, '');
    const guild = ctx.guild;
    const found = raw && guild ? (guild.channels.cache.get(raw) ?? await guild.channels.fetch(raw).catch(() => null)) : ctx.channel;
    if (!found || !('messages' in found)) {
      await ctx.send(errorReply(ctx, 'Channel not found or does not support messages.'));
      return 'skipped';
    }
    const channel = found;

    const oldest = await channel.messages.fetch({ after: '0', limit: 1 }).catch(() => null);
    const message = oldest?.first();
    if (!message) {
      await ctx.send(errorReply(ctx, 'Could not find any messages in that channel.'));
      return 'skipped';
    }

    const content = message.content.length > 500 ? `${message.content.slice(0, 500)}…` : message.content;
    await ctx.send(
      firstMessageCard({
        accentColor: ctx.guild ? cachedColor(ctx.guild.id) ?? config.color : config.color,
        channelId: channel.id,
        authorId: message.author.id,
        authorTag: message.author.tag,
        content: content || '*No text content*',
        createdTimestamp: message.createdTimestamp,
        url: message.url,
      }),
    );
    return 'completed';
  },

  async getinvite(ctx) {
    const raw = ctx.args[0]?.replace(/[<@!>]/g, '');
    if (!raw) {
      await ctx.send(usageReply(ctx, 'Please provide a bot mention or bot ID.'));
      return 'skipped';
    }

    const user = await ctx.client.users.fetch(raw).catch(() => null);
    if (!user) {
      await ctx.send(errorReply(ctx, 'Could not find a user with that mention or ID.'));
      return 'skipped';
    }
    if (!user.bot) {
      await ctx.send(errorReply(ctx, `${user.tag} is not a bot account.`));
      return 'skipped';
    }

    const url = `https://discord.com/oauth2/authorize?client_id=${user.id}&permissions=0&scope=${encodeURIComponent('bot applications.commands')}`;

    await ctx.send(
      getInviteCard({
        accentColor: ctx.guild ? cachedColor(ctx.guild.id) ?? config.color : config.color,
        botTag: user.tag,
        botId: user.id,
        avatarURL: user.displayAvatarURL({ size: THUMBNAIL_SIZE }),
        inviteURL: url,
      }),
    );
    return 'completed';
  },

  async inviteinfo(ctx) {
    const raw = ctx.args[0];
    if (!raw) {
      await ctx.send(usageReply(ctx, `Please provide an invite code or link.\nUsage: \`${ctx.prefix}inviteinfo <invite>\``));
      return 'skipped';
    }

    const code = raw.replace(/^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\//i, '').trim();
    const invite = await ctx.client.fetchInvite(code).catch(() => null);
    if (!invite || !invite.guild) {
      await ctx.send(errorReply(ctx, 'That invite code is invalid or expired.'));
      return 'skipped';
    }

    await ctx.send(
      inviteInfoCard({
        accentColor: ctx.guild ? cachedColor(ctx.guild.id) ?? config.color : config.color,
        guildName: invite.guild.name,
        guildIconURL: invite.guild.iconURL({ size: THUMBNAIL_SIZE }),
        code: invite.code,
        inviterTag: invite.inviter?.tag ?? null,
        uses: invite.uses,
        maxUses: invite.maxUses,
        temporary: invite.temporary,
        channelName: invite.channel && 'name' in invite.channel ? invite.channel.name : null,
        expiresTimestamp: invite.expiresTimestamp,
        inviteURL: invite.url,
      }),
    );
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
