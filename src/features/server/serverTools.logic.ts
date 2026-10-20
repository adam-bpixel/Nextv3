import { PollLayoutType, type Role } from 'discord.js';
import { requireGuild, fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { discordTimestamp, formatDuration, isDuration, parseDuration } from '../../core/format';
import { toSnakeCase } from '../../core/permissions';
import { asBotClient } from '../../core/client';
import { setChannelLocked } from '../moderation/moderation.service';
import {
  clearUnlock,
  deleteReminder,
  isPollEnabled,
  scheduleReminder,
  scheduleUnlock,
  setPollEnabled,
} from './serverTools.model';

const MS_PER_MINUTE_DEFAULT = 10 * 60 * 1000;
const EVERYONE_VIEW_DENY_PERMISSIONS = { ViewChannel: false } as const;

function guildTextChannel(ctx: Parameters<CommandHandler>[0]) {
  const channel = ctx.channel;
  if (!channel || !('permissionOverwrites' in channel)) return null;
  return channel as import('discord.js').GuildTextBasedChannel;
}

async function resolveRoleOrMember(ctx: Parameters<CommandHandler>[0], index: number) {
  const guild = ctx.guild;
  if (!guild) return null;
  const raw = ctx.args[index] ?? '';
  const roleMatch = /^<@&(\d{15,22})>$|^(\d{15,22})$/.exec(raw);
  const roleId = roleMatch?.[1] ?? roleMatch?.[2];
  if (roleId) {
    const role = guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId).catch(() => null));
    if (role) return { kind: 'role' as const, role };
  }
  const member = await ctx.targetMember(index);
  if (member) return { kind: 'member' as const, member };
  return null;
}

export const serverToolsLogic = {
  async hide(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channel = guildTextChannel(ctx);
    if (!channel) return fail(ctx, "I can't hide this channel.");
    await channel.permissionOverwrites.edit(guild.roles.everyone, EVERYONE_VIEW_DENY_PERMISSIONS);
    await ctx.send(successReply(ctx, `- Channel ${channel} is now hidden from @everyone.`));
    return 'completed';
  },

  async show(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channel = guildTextChannel(ctx);
    if (!channel) return fail(ctx, "I can't unhide this channel.");
    await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: null });
    await ctx.send(successReply(ctx, `- Channel ${channel} is now visible to @everyone.`));
    return 'completed';
  },

  async mperm(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channel = guildTextChannel(ctx);
    if (!channel) return fail(ctx, "I can't check permissions in this channel.");
    const resolved = await resolveRoleOrMember(ctx, 0);
    if (!resolved) return fail(ctx, `Mention a user or role, or give their ID.\nUse: \`${ctx.prefix}mperm <user or role>\`.`);
    const target = resolved.kind === 'role' ? resolved.role : resolved.member;
    const permissions = channel.permissionsFor(target as Role | import('discord.js').GuildMember);
    const names = permissions.toArray().map((flag) => toSnakeCase(flag).replace(/_/g, ' '));
    const label = resolved.kind === 'role' ? resolved.role.toString() : resolved.member.toString();
    const lines = names.length
      ? [`- __**Permissions for**__ ﹕ ${label} in ${channel}`, ...names.map((name) => `  \`${name}\``)]
      : [`- __**Permissions for**__ ﹕ ${label} in ${channel}`, '  *None*'];
    await ctx.send(successReply(ctx, lines.join('\n')));
    return 'completed';
  },

  async nick(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention a user or give their ID.\nUse: \`${ctx.prefix}nick <user> <new nickname|reset>\`.`);
    const value = ctx.args.slice(1).join(' ').trim();
    if (!value) return fail(ctx, `Give a nickname or \`reset\`.\nUse: \`${ctx.prefix}nick <user> <new nickname|reset>\`.`);
    const next = value.toLowerCase() === 'reset' ? null : value;
    try {
      await member.setNickname(next);
    } catch {
      return fail(ctx, "I can't change that member's nickname — they may have an equal or higher role than me.");
    }
    await ctx.send(successReply(ctx, next ? `- Set **${member.user.tag}**'s nickname to **${next}**.` : `- Reset **${member.user.tag}**'s nickname.`));
    return 'completed';
  },

  async poll(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const first = (ctx.args[0] ?? '').toLowerCase();
    if (first === 'on' || first === 'off') {
      await setPollEnabled(guild.id, first === 'on');
      await ctx.send(successReply(ctx, `- Polls are now **${first === 'on' ? 'enabled' : 'disabled'}** in this server.`));
      return 'completed';
    }
    const question = ctx.text.trim();
    if (!question) return fail(ctx, `Give a question, or \`on\`/\`off\` to toggle polls.\nUse: \`${ctx.prefix}poll <on|off|question>\`.`);
    if (!(await isPollEnabled(guild.id))) {
      return fail(ctx, `Polls are disabled in this server. An admin can enable them with \`${ctx.prefix}poll on\` first.`);
    }
    const channel = guildTextChannel(ctx);
    if (!channel || !('send' in channel)) return fail(ctx, "I can't send a poll in this channel.");
    await channel.send({
      poll: {
        question: { text: question.slice(0, 300) },
        answers: [{ text: 'Yes' }, { text: 'No' }],
        duration: 24,
        allowMultiselect: false,
        layoutType: PollLayoutType.Default,
      },
    });
    return 'completed';
  },

  async pushdatabase(ctx) {
    const config = (await import('../../core/config')).default;
    if (ctx.user.id !== config.ownerId) {
      return fail(ctx, 'You are not authorized to use this command.');
    }
    const db = (await import('../../core/db')).default;
    try {
      const probe = await db.all('guildToolSettings');
      await ctx.send(successReply(ctx, `- Database connection is healthy. Sampled **${probe.length}** record(s) from \`guildToolSettings\`.`));
    } catch (error) {
      await ctx.send(errorReply(ctx, `Database check failed: ${error instanceof Error ? error.message : String(error)}`));
    }
    return 'completed';
  },

  async remind(ctx) {
    const durationText = ctx.args[0];
    if (!durationText || !isDuration(durationText) || ctx.args.length < 2) {
      return fail(ctx, `Give a duration and a reminder.\nUse: \`${ctx.prefix}remind <duration> <text>\` (example: \`${ctx.prefix}remind 10m take a break\`).`);
    }
    const text = ctx.args.slice(1).join(' ').trim();
    if (!text) return fail(ctx, `Give reminder text.\nUse: \`${ctx.prefix}remind <duration> <text>\`.`);
    const ms = parseDuration(durationText, MS_PER_MINUTE_DEFAULT);
    const dueAt = Date.now() + ms;
    const id = `${ctx.user.id}-${dueAt}-${Math.random().toString(36).slice(2, 8)}`;
    await scheduleReminder({ id, userId: ctx.user.id, guildId: ctx.guild?.id ?? null, channelId: ctx.channel?.id ?? null, dueAt, text });
    await ctx.send(successReply(ctx, `- I'll remind you ${discordTimestamp(dueAt)}: "${text}"`));
    return 'completed';
  },

  async tag(ctx) {
    const name = (ctx.args[0] ?? '').toLowerCase();
    if (!name) return fail(ctx, `Give a command name.\nUse: \`${ctx.prefix}tag <command name>\` (example: \`${ctx.prefix}tag avatar\`).`);
    const client = asBotClient(ctx.client);
    const command = client.findPrefixCommand(name);
    if (!command) return fail(ctx, `No command named \`${name}\` was found.`);
    const { getCooldown } = await import('../../core/cooldowns');
    const cooldown = getCooldown(command.name, command.cooldown);
    const lines = [
      `- __**Command**__ ﹕ \`${ctx.prefix}${command.name}\``,
      `- __**Description**__ ﹕ ${command.description || '*None*'}`,
      `- __**Usage**__ ﹕ \`${ctx.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\``,
      `- __**Category**__ ﹕ ${command.category || '*None*'}`,
      `- __**Cooldown**__ ﹕ ${cooldown}s`,
      `- __**Permissions**__ ﹕ ${command.permissions.length ? command.permissions.map((p) => `\`${p}\``).join(', ') : '*None*'}`,
    ];
    await ctx.send(successReply(ctx, lines.join('\n')));
    return 'completed';
  },

  async tempchannel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const sub = (ctx.args[0] ?? '').toLowerCase();
    const { tempChannelAction } = await import('./tempChannel.model');
    const result = await tempChannelAction(guild, ctx.channel, ctx.member, sub, ctx.args.slice(1));
    if (!result.ok) return fail(ctx, result.message);
    await ctx.send(successReply(ctx, result.message));
    return 'completed';
  },

  async timelock(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channel = guildTextChannel(ctx);
    if (!channel) return fail(ctx, "I can't lock this channel.");
    const durationText = ctx.args[0];
    if (!durationText || !isDuration(durationText)) {
      return fail(ctx, `Give a duration.\nUse: \`${ctx.prefix}timelock <duration>\` (example: \`${ctx.prefix}timelock 30m\`).`);
    }
    const ms = parseDuration(durationText, MS_PER_MINUTE_DEFAULT);
    const dueAt = Date.now() + ms;
    await setChannelLocked(channel, guild, true);
    const id = `${guild.id}-${channel.id}`;
    await scheduleUnlock({ id, guildId: guild.id, channelId: channel.id, dueAt });
    await ctx.send(
      successReply(ctx, `- Channel ${channel} is locked for **${formatDuration(ms)}** and will unlock ${discordTimestamp(dueAt)}.`),
    );
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
