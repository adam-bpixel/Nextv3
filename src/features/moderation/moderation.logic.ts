import { MS_PER_MINUTE, MS_PER_SECOND, isDuration, parseDuration } from '../../core/format';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { listWarnings } from './warnings.model';
import {
  DISCORD_BULK_DELETE_MAX,
  DISCORD_BULK_DELETE_MIN,
  DISCORD_MAX_SLOWMODE_SECONDS,
  DISCORD_MAX_TIMEOUT_MS,
  NO_REASON,
  REFUSALS,
  banUser,
  kickMember,
  purgeMessages,
  removeTimeout,
  setChannelLocked,
  setSlowmode,
  timeoutMember,
  unbanUser,
  warnUser,
} from './moderation.service';
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
    if (!target) return fail(ctx, 'Mention who to ban.');
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const reason = reasonFrom(ctx.args, 1);
    const refusal = await banUser(guild, ctx.member, target, reason);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(ctx.embed(ui.bannedEmbed(target.username, reason)));
    return 'completed';
  },

  async unban(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const userId = USER_ID.exec(ctx.args[0] ?? '')?.[1];
    if (!userId) return fail(ctx, 'Give the ID of the user to unban.');
    if (!(await unbanUser(guild, userId))) return fail(ctx, "That user isn't banned.");
    await ctx.send(ctx.embed(ui.unbannedEmbed(userId)));
    return 'completed';
  },

  async kick(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, 'Mention who to kick.');
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const reason = reasonFrom(ctx.args, 1);
    const refusal = await kickMember(member, ctx.member, reason);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(ctx.embed(ui.kickedEmbed(member.user.username, reason)));
    return 'completed';
  },

  async timeout(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, 'Mention who to time out.');
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const { durationMs, reason } = timeoutRequest(ctx.args);
    const refusal = await timeoutMember(member, ctx.member, durationMs, reason);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(ctx.embed(ui.timedOutEmbed(member.user.username, Date.now() + durationMs, reason)));
    return 'completed';
  },

  async untimeout(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, 'Mention who to un-mute.');
    if (!ctx.member) return fail(ctx, REFUSALS.moderatorUnknown);
    const refusal = await removeTimeout(member, ctx.member);
    if (refusal) return fail(ctx, refusal);
    await ctx.send(ctx.embed(ui.timeoutRemovedEmbed(member.user.username)));
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
    const confirmation = await ctx.send(ctx.embed(ui.purgedEmbed(deleted)), { reply: false });
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
    await ctx.send(ctx.embed(ui.slowmodeEmbed(seconds)));
    return 'completed';
  },

  async lock(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await setChannelLocked(ctx.channel, guild, true);
    await ctx.send(ctx.embed(ui.lockedEmbed(true)));
    return 'completed';
  },

  async unlock(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await setChannelLocked(ctx.channel, guild, false);
    await ctx.send(ctx.embed(ui.lockedEmbed(false)));
    return 'completed';
  },

  async warn(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, 'Mention who to warn.');
    const reason = reasonFrom(ctx.args, 1);
    const warnings = await warnUser(guild, target, ctx.user, reason);
    await ctx.send(ctx.embed(ui.warnedEmbed(target.username, warnings.length, reason)));
    return 'completed';
  },

  async warnings(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.targetUser();
    await ctx.send(ctx.embed(ui.warningsEmbed(target.username, await listWarnings(guild.id, target.id))));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
