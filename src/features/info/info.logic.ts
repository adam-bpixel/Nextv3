import fs from 'node:fs';
import path from 'node:path';
import {
  ContainerBuilder,
  MessageFlags,
  OAuth2Scopes,
  PermissionFlagsBits,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  version as discordJsVersion,
  type APIEmbedField,
} from 'discord.js';
import { asBotClient } from '../../core/client';
import config from '../../core/config';
import { discordTimestamp, formatDuration } from '../../core/format';
import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { rolesPage } from './info.ui';

const LARGE_AVATAR = 1024;
const THUMBNAIL_SIZE = 256;
const MAX_LISTED_ROLES = 15;

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
  async ping(ctx) {
    const latency = Date.now() - ctx.createdTimestamp;
    await ctx.send(ctx.embed({ title: '🏓 Pong!', description: `Latency: **${latency}ms**\nAPI: **${Math.round(ctx.client.ws.ping)}ms**` }));
    return 'completed';
  },

  async avatar(ctx) {
    const user = await ctx.targetUser();
    await ctx.send(ctx.embed({ title: `${user.displayName || user.username}'s avatar`, image: { url: user.displayAvatarURL({ size: LARGE_AVATAR }) } }));
    return 'completed';
  },

  async userinfo(ctx) {
    const user = await ctx.targetUser();
    const member = ctx.guild ? await ctx.guild.members.fetch(user.id).catch(() => null) : null;
    const fields: APIEmbedField[] = [
      { name: 'ID', value: user.id, inline: true },
      { name: 'Account created', value: discordTimestamp(user.createdTimestamp), inline: true },
    ];
    if (member && ctx.guild) {
      const everyoneRoleId = ctx.guild.id;
      fields.push({ name: 'Joined server', value: discordTimestamp(member.joinedTimestamp ?? 0), inline: true });
      const roles = member.roles.cache.filter((role) => role.id !== everyoneRoleId).map((role) => `<@&${role.id}>`);
      fields.push({ name: `Roles (${roles.length})`, value: roles.slice(0, MAX_LISTED_ROLES).join(' ') || 'None' });
    }
    await ctx.send(ctx.embed({ title: user.tag || user.username, thumbnail: { url: user.displayAvatarURL({ size: THUMBNAIL_SIZE }) }, fields }));
    return 'completed';
  },

  async serverinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const icon = guild.iconURL({ size: THUMBNAIL_SIZE });
    await ctx.send(
      ctx.embed({
        title: guild.name,
        ...(icon ? { thumbnail: { url: icon } } : {}),
        fields: [
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Members', value: String(guild.memberCount), inline: true },
          { name: 'Created', value: discordTimestamp(guild.createdTimestamp), inline: true },
          { name: 'Channels', value: String(guild.channels.cache.size), inline: true },
          { name: 'Roles', value: String(guild.roles.cache.size), inline: true },
          { name: 'Boosts', value: String(guild.premiumSubscriptionCount ?? 0), inline: true },
        ],
      }),
    );
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
    const client = asBotClient(ctx.client);
    const members = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
    const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    const prefixCommands = client.commands.size;
    const slashCommands = client.slashCommands.size;
    const created = client.user?.createdTimestamp ? `<t:${Math.floor(client.user.createdTimestamp / 1000)}:F>` : 'Unknown';

    const content =
      `# ${config.botName} Overview (V2)\n` +
      `**Bot Version:** \`${BOT_VERSION}\`\n` +
      `**Current Prefix:** \`${config.prefix}\`\n\n` +
      `## Stats\n` +
      `**Servers:** \`${client.guilds.cache.size}\`\n` +
      `**Members:** \`${members}\`\n` +
      `**Channels:** \`${client.channels.cache.size}\`\n` +
      `**Uptime:** \`${formatDuration(client.uptime ?? 0)}\`\n` +
      `**Ping:** \`${Math.round(client.ws.ping)}ms\`\n` +
      `**Memory:** \`${memoryMb} MB\`\n\n` +
      `## Commands\n` +
      `**Prefix Commands:** \`${prefixCommands}\`\n` +
      `**Slash Commands:** \`${slashCommands}\`\n` +
      `**Total Loaded:** \`${prefixCommands + slashCommands}\`\n\n` +
      `## Runtime\n` +
      `**Node.js:** \`${process.version}\`\n` +
      `**discord.js:** \`${discordJsVersion}\`\n` +
      `**Database:** \`${config.mongoUri ? 'MongoDB' : 'Local JSON'}\`\n` +
      `**Created:** ${created}\n\n` +
      `## Owner\n` +
      `**Owner:** ${config.ownerId ? `<@${config.ownerId}>` : 'Unknown'}\n\n` +
      `-# © ${new Date().getFullYear()} ${config.botName}`;

    const avatar = client.user?.displayAvatarURL({ size: THUMBNAIL_SIZE }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
    const container = new ContainerBuilder()
      .setAccentColor(config.color)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar)),
      );

    await ctx.send({ components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
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
} satisfies Record<string, CommandHandler>;
