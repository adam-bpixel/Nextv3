import { MS_PER_MINUTE, MS_PER_SECOND, discordTimestamp, formatDuration, isDuration, parseDuration } from '../../core/format';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';
import { clearWarnings, listWarnings, removeLastWarning } from './warnings.model';
import {
  DISCORD_BULK_DELETE_MAX,
  DISCORD_BULK_DELETE_MIN,
  DISCORD_MAX_SLOWMODE_SECONDS,
  DISCORD_MAX_TIMEOUT_MS,
  NO_REASON,
  REFUSALS,
  banUser,
  fetchBanLogs,
  fetchKickLogs,
  fetchTimeoutLogs,
  guildTextChannel,
  kickMember,
  purgeMessages,
  removeTimeout,
  setChannelLocked,
  setSlowmode,
  softbanUser,
  syncWarnRole,
  timeoutMember,
  unbanUser,
  warnUser,
} from './moderation.service';
import { notifyMember, reasonLines } from './moderation.dm';
import * as ui from './moderation.ui';

const DEFAULT_TIMEOUT_MS = 10 * MS_PER_MINUTE;
const PURGE_CONFIRMATION_LIFETIME_MS = 4000;
const USER_ID = /(\d{15,22})/;
const SLOWMODE_OFF = /^(off|0)$/i;

const reasonFrom = (args: readonly string[], start: number): string => args.slice(start).join(' ') || NO_REASON;

export function timeoutRequest(args: readonly string[]): { durationMs: number; reason: string } {
  const durationText = args[1];
  if (!isDuration(durationText)) return { durationMs: DEFAULT_TIMEOUT_MS, reason: reasonFrom(args, 1) };
  return { durationMs: Math.min(parseDuration(durationText, DEFAULT_TIMEOUT_MS), DISCORD_MAX_TIMEOUT_MS), reason: reasonFrom(args, 2) };
}

export const moderationLogic = {
  async ban(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}ban <user> [reason]\`.`);
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const reason = reasonFrom(ctx.args, 1);
    const refusal = await banUser(guild, ctx.member, target, reason);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(successReply(ctx, `- Banned **${target.username}**.\n- Reason: ${reason}`));
    return 'completed';
  },

  async unban(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const userId = USER_ID.exec(ctx.args[0] ?? '')?.[1];
    if (!userId) return fail(ctx, `Enter the user ID to unban.\nUse: \`${ctx.prefix}unban <user ID> [reason]\`.`);
    if (!(await unbanUser(guild, userId))) return fail(ctx, "That user isn't banned.");
    await ctx.send(successReply(ctx, `- <@${userId}> can join the server again.`));
    return 'completed';
  },

  async kick(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}kick <user> [reason]\`.`);
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const reason = reasonFrom(ctx.args, 1);
    const refusal = await kickMember(member, ctx.member, reason);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(successReply(ctx, `- Kicked **${member.user.username}**.\n- Reason: ${reason}`));
    return 'completed';
  },

  async timeout(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}timeout <user> <duration> [reason]\`.`);
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const { durationMs, reason } = timeoutRequest(ctx.args);
    const refusal = await timeoutMember(member, ctx.member, durationMs, reason);
    if (refusal) return fail(ctx, refusal);
    await notifyMember(member.user, 'You Were Muted', [`Server: \`${member.guild.name}\``, `Until: ${discordTimestamp(Date.now() + durationMs, 'f')}`, ...reasonLines(reason), `By: \`${ctx.user.username}\``]);
    await ctx.send(successReply(ctx, `- Timed out **${member.user.username}** until ${discordTimestamp(Date.now() + durationMs, 'f')}.\n- Reason: ${reason}`));
    return 'completed';
  },

  async untimeout(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}unmute <user> [reason]\`.`);
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const refusal = await removeTimeout(member, ctx.member);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(successReply(ctx, `- Timeout removed for **${member.user.username}**.`));
    return 'completed';
  },

  async purge(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const count = Number.parseInt(ctx.args[0] ?? '', 10);
    if (!(count >= DISCORD_BULK_DELETE_MIN && count <= DISCORD_BULK_DELETE_MAX)) {
      return fail(ctx, `Give a number of messages between ${DISCORD_BULK_DELETE_MIN} and ${DISCORD_BULK_DELETE_MAX}.`);
    }
    const commandMessage = ctx.source.kind === 'message' ? ctx.source.message : null;
    if (commandMessage) await commandMessage.delete().catch(() => undefined);
    const deleted = await purgeMessages(ctx.channel, count);
    const confirmation = await ctx.send(successReply(ctx, `- Deleted **${deleted}** messages.`), { reply: false });
    if (commandMessage) setTimeout(() => void confirmation.delete().catch(() => undefined), PURGE_CONFIRMATION_LIFETIME_MS);
    return 'completed';
  },

  async slowmode(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const seconds = SLOWMODE_OFF.test(ctx.args[0] ?? '')
      ? 0
      : Math.min(Math.round(parseDuration(ctx.args[0], Number.NaN) / MS_PER_SECOND), DISCORD_MAX_SLOWMODE_SECONDS);
    if (!Number.isFinite(seconds)) return fail(ctx, 'Give a duration like `10s`, `5m` or `off`.');
    await setSlowmode(ctx.channel, seconds);
    await ctx.send(successReply(ctx, seconds ? `- Slowmode set to **${formatDuration(seconds * MS_PER_SECOND)}**.` : '- Slowmode is off.'));
    return 'completed';
  },

  async lock(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await setChannelLocked(ctx.channel, guild, true);
    await ctx.send(successReply(ctx, '- This channel is locked.'));
    return 'completed';
  },

  async unlock(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await setChannelLocked(ctx.channel, guild, false);
    await ctx.send(successReply(ctx, '- This channel is unlocked.'));
    return 'completed';
  },

  async warn(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}warn <user> [reason]\`.`);
    const reason = reasonFrom(ctx.args, 1);
    const warnings = await warnUser(guild, target, ctx.user, reason);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (member) await syncWarnRole(guild, member, warnings.length);
    await notifyMember(target, 'You Were Warned', [`Server: \`${guild.name}\``, ...reasonLines(reason), `Warnings: \`${warnings.length}\``, `By: \`${ctx.user.username}\``]);
    await ctx.send(successReply(ctx, `- Warned **${target.username}**. They now have **${warnings.length}** warning(s).\n- Reason: ${reason}`));
    return 'completed';
  },

  async warnings(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.targetUser();
    await ctx.send(ctx.embed(ui.warningsEmbed(target.username, await listWarnings(guild.id, target.id))));
    return 'completed';
  },

  async warnlogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.targetUser();
    await ctx.send(ctx.embed(ui.warningsEmbed(target.username, await listWarnings(guild.id, target.id))));
    return 'completed';
  },

  async unwarn(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}unwarn <user>\`.`);
    const remaining = await removeLastWarning(guild.id, target.id);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (member) await syncWarnRole(guild, member, remaining.length);
    await ctx.send(successReply(ctx, `- Removed the latest warning from **${target.username}**. They now have **${remaining.length}** warning(s).`));
    return 'completed';
  },

  async clearwarns(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}clearwarns <user>\`.`);
    await clearWarnings(guild.id, target.id);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (member) await syncWarnRole(guild, member, 0);
    await ctx.send(successReply(ctx, `- Cleared all warnings and warn roles for **${target.username}**.`));
    return 'completed';
  },

  async softban(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}softban <user> [delete days 0-7] [reason]\`.`);
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const daysArg = Number.parseInt(ctx.args[1] ?? '', 10);
    const hasDays = Number.isFinite(daysArg) && String(daysArg) === ctx.args[1];
    const deleteDays = hasDays ? Math.min(Math.max(daysArg, 0), 7) : 0;
    const reason = reasonFrom(ctx.args, hasDays ? 2 : 1);
    const refusal = await softbanUser(guild, ctx.member, target, deleteDays, reason);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(successReply(ctx, `- Softbanned **${target.username}** (deleted ${deleteDays} day(s) of messages).\n- Reason: ${reason}`));
    return 'completed';
  },

  async banlogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}banlogs <user>\`.`);
    await ctx.send(ctx.embed(ui.auditLogEmbed('Ban Logs', target.username, await fetchBanLogs(guild, target.id))));
    return 'completed';
  },

  async kicklogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}kicklogs <user>\`.`);
    await ctx.send(ctx.embed(ui.auditLogEmbed('Kick Logs', target.username, await fetchKickLogs(guild, target.id))));
    return 'completed';
  },

  async timeoutlogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}timeoutlogs <user>\`.`);
    await ctx.send(ctx.embed(ui.auditLogEmbed('Timeout Logs', target.username, await fetchTimeoutLogs(guild, target.id))));
    return 'completed';
  },

  async deny(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const id = /\d{15,22}/.exec(ctx.args[0] ?? '')?.[0];
    if (!id) return fail(ctx, `Mention a user or role, or enter their ID.\nUse: \`${ctx.prefix}deny <user or role>\`.`);
    const role = guild.roles.cache.get(id);
    const member = role ? null : await guild.members.fetch(id).catch(() => null);
    const target = role ?? member;
    if (!target) return fail(ctx, "I couldn't find that user or role.");
    const channel = guildTextChannel(ctx.channel);
    if (channel.isThread()) return fail(ctx, "I can't edit permissions in a thread — use this in a regular channel.");
    await channel.permissionOverwrites.edit(target, { ViewChannel: false, SendMessages: false });
    const label = role ? `the **${role.name}** role` : `**${member?.user.username}**`;
    await ctx.send(successReply(ctx, `- Denied channel access for ${label}.`));
    return 'completed';
  },

  async perminall(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const roleId = /\d{15,22}/.exec(ctx.args[0] ?? '')?.[0];
    if (!roleId) return fail(ctx, `Mention a role or enter its ID.\nUse: \`${ctx.prefix}perminall <role ID>\`.`);
    const role = guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId).catch(() => null));
    if (!role) return fail(ctx, "I couldn't find that role.");
    const channel = guildTextChannel(ctx.channel);
    if (channel.isThread()) return fail(ctx, "I can't edit permissions in a thread — use this in a regular channel.");
    await channel.permissionOverwrites.edit(role, { SendMessages: true, Connect: true });
    await ctx.send(successReply(ctx, `- Gave **${role.name}** send message and connect permissions in ${channel}.`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
