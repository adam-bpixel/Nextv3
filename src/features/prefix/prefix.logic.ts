import config, { fillTemplate, isOwner } from '../../core/config';
import { permissionLabel } from '../../core/permissions';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler, CommandOutcome } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { isPremiumUser } from '../premium/premium.model';
import { getGuildPrefix, getUserPrefix, isValidPrefix, resetGuildPrefix, resetUserPrefix, setGuildPrefix, setUserPrefix } from './prefix.model';

async function canUsePersonalPrefix(userId: string): Promise<boolean> {
  return isOwner(userId) || isPremiumUser(userId);
}

async function setSelfPrefix(ctx: Parameters<CommandHandler>[0]): Promise<CommandOutcome> {
  if (!(await canUsePersonalPrefix(ctx.user.id))) {
    await ctx.send(errorReply(ctx, `Personal prefixes need an active **Premium** subscription. Check \`${ctx.prefix}subscription\`.`));
    return 'skipped';
  }

  const [, requested] = ctx.args;
  const current = await getUserPrefix(ctx.user.id);
  if (!requested) {
    return fail(
      ctx,
      current
        ? `Your personal prefix: \`${current}\`.\nUse: \`${ctx.prefix}prefix self <new prefix>\` to change it.\nUse: \`${ctx.prefix}prefix self reset\` to remove it.`
        : `You don't have a personal prefix yet.\nUse: \`${ctx.prefix}prefix self <new prefix>\` to set one.`,
    );
  }

  if (requested.toLowerCase() === 'reset') {
    if (!current) return fail(ctx, "You don't have a personal prefix to reset.");
    await resetUserPrefix(ctx.user.id);
    await ctx.send(successReply(ctx, 'Your personal prefix was removed.'));
    return 'completed';
  }

  if (!isValidPrefix(requested)) {
    return fail(ctx, `Prefix must be 1–10 characters with no spaces.\nUse: \`${ctx.prefix}prefix self <new prefix>\`.`);
  }

  await setUserPrefix(ctx.user.id, requested);
  await ctx.send(successReply(ctx, `Your personal prefix is now \`${requested}\`.\nIt works for you in any server, instead of that server's prefix.`));
  return 'completed';
}

export const prefixLogic = {
  async setPrefix(ctx) {
    if (ctx.args[0]?.toLowerCase() === 'self') return setSelfPrefix(ctx);

    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';

    if (!ctx.hasPermission('manage_guild')) {
      await ctx.send(errorReply(ctx, fillTemplate(config.messages.missingPermission, { permission: permissionLabel('manage_guild') })));
      return 'skipped';
    }

    const [requested] = ctx.args;
    const currentPrefix = await getGuildPrefix(guild.id);
    if (!requested) {
      return fail(
        ctx,
        `Current prefix: \`${currentPrefix}\`.\nUse: \`${currentPrefix}prefix <new prefix>\` to change it.\nUse: \`${currentPrefix}prefix reset\` to restore \`${config.prefix}\`.\nUse: \`${currentPrefix}prefix self <new prefix|reset>\` to set your personal prefix (Premium).`,
      );
    }

    if (requested.toLowerCase() === 'reset') {
      await resetGuildPrefix(guild.id);
      await ctx.send(successReply(ctx, `Server prefix reset to \`${config.prefix}\`.\nUse: \`${config.prefix}help\` to see the commands.`));
      return 'completed';
    }

    if (!isValidPrefix(requested)) {
      return fail(ctx, `Prefix must be 1–10 characters with no spaces.\nUse: \`${currentPrefix}prefix <new prefix>\`.`);
    }

    await setGuildPrefix(guild.id, requested);
    await ctx.send(successReply(ctx, `Server prefix changed from \`${currentPrefix}\` to \`${requested}\`.\nUse: \`${requested}help\` to see the commands.`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
