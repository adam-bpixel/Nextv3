import config from '../../core/config';
import { formatDuration, isDuration, parseDuration } from '../../core/format';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';
import { loadWallet, saveWallet } from '../economy/wallet.model';
import { addToBlacklist, getBlacklistEntry, giveXpBoost, isWorkMode, listBlacklist, removeFromBlacklist, setWorkMode } from './owner.model';
import { errorFailure, money, positiveAmount, targetFrom, usageFailure } from './owner.logic.helpers';

export const ownerEconomyLogic = {
  async ownerAddRvp(ctx) {
    const target = await targetFrom(ctx);
    const amount = positiveAmount(ctx.args[1]);
    if (!target || !amount) return usageFailure(ctx, `Mention a user and give a positive amount.\nUse: \`${ctx.prefix}addcoins <user mention or ID> <amount>\`.`);
    const wallet = await loadWallet(target.id);
    const balance = wallet.wallet + amount;
    await saveWallet(target.id, { ...wallet, wallet: balance });
    await ctx.send(successReply(ctx, `- Added ${money(amount)} to <@${target.id}>.\n- New wallet balance: ${money(balance)}.`));
    return 'completed';
  },

  async ownerRemoveRvp(ctx) {
    const target = await targetFrom(ctx);
    if (!target) return usageFailure(ctx, `Mention a user or give their ID.\nUse: \`${ctx.prefix}removecoins <user mention or ID> <amount|all>\`.`);
    const wallet = await loadWallet(target.id);
    const total = wallet.wallet + wallet.bank;
    const amount = ctx.args[1]?.toLowerCase() === 'all' ? total : positiveAmount(ctx.args[1]);
    if (!amount || amount > total) return errorFailure(ctx, `The amount must be between 1 and ${total.toLocaleString()}.`);
    const fromWallet = Math.min(wallet.wallet, amount);
    const fromBank = amount - fromWallet;
    await saveWallet(target.id, { ...wallet, wallet: wallet.wallet - fromWallet, bank: wallet.bank - fromBank });
    await ctx.send(successReply(ctx, `- Removed ${money(amount)} from <@${target.id}>.\n- New total balance: ${money(total - amount)}.`));
    return 'completed';
  },

  async ownerBlacklist(ctx) {
    const sub = ctx.args[0]?.toLowerCase();
    if (sub === 'list') {
      const entries = (await listBlacklist()).slice(0, 25);
      await ctx.send(successReply(ctx, entries.length ? entries.map((entry, index) => `- **${index + 1}.** <@${entry.userId}> (\`${entry.userId}\`) · ${entry.reason}`).join('\n') : '- No users are blacklisted.'));
      return 'completed';
    }
    if (sub !== 'add' && sub !== 'remove') return usageFailure(ctx, `Say \`add\`, \`remove\`, or \`list\`.\nUse: \`${ctx.prefix}blacklist <add|remove|list> [user] [reason]\`.`);
    const target = await targetFrom(ctx, 1);
    if (!target) return usageFailure(ctx, `Mention a user or give their ID.\nUse: \`${ctx.prefix}blacklist ${sub} <user mention or ID> [reason]\`.`);
    if (target.id === config.ownerId) return errorFailure(ctx, 'The bot owner cannot be blacklisted.');
    const existing = await getBlacklistEntry(target.id);
    if (sub === 'add') {
      if (existing) return errorFailure(ctx, `<@${target.id}> is already blacklisted.`);
      const reason = ctx.args.slice(2).join(' ').trim() || 'No reason provided';
      await addToBlacklist(target.id, reason, ctx.user.id);
      await ctx.send(successReply(ctx, `- Blacklisted <@${target.id}>.\n- Reason: ${reason}`));
    } else {
      if (!existing || !(await removeFromBlacklist(target.id))) return errorFailure(ctx, `<@${target.id}> is not blacklisted.`);
      await ctx.send(successReply(ctx, `- Removed <@${target.id}> from the blacklist.`));
    }
    return 'completed';
  },

  async ownerWorkMode(ctx) {
    const sub = ctx.args[0]?.toLowerCase();
    if (sub !== 'on' && sub !== 'off') return usageFailure(ctx, `Say \`on\` or \`off\`.\nUse: \`${ctx.prefix}workmode <on|off>\`. Current status: **${await isWorkMode() ? 'on' : 'off'}**.`);
    const enabled = sub === 'on';
    await setWorkMode(enabled);
    await ctx.send(successReply(ctx, enabled ? '- Work mode enabled. The bot will respond only to you.' : '- Work mode disabled.'));
    return 'completed';
  },

  async ownerCardGive(ctx) {
    const target = await targetFrom(ctx);
    const multiplierMatch = (ctx.args[1] ?? '').match(/^(\d+(?:\.\d+)?)x?$/i);
    const multiplier = multiplierMatch ? Number(multiplierMatch[1]) : 0;
    const durationMs = isDuration(ctx.args[2]) ? parseDuration(ctx.args[2], Number.NaN) : Number.NaN;
    if (!target || !Number.isFinite(multiplier) || multiplier <= 0 || !Number.isFinite(durationMs) || durationMs <= 0) {
      return usageFailure(ctx, `Mention a user and give a valid multiplier and duration.\nUse: \`${ctx.prefix}cardgive <user mention or ID> <multiplier>x <duration>\` (e.g. 2x 1d).`);
    }
    const expiresAt = await giveXpBoost(target.id, multiplier, durationMs);
    await ctx.send(successReply(ctx, `- Gave <@${target.id}> a **${multiplier}x XP boost**.\n- Expires <t:${Math.floor(expiresAt / 1000)}:R> (${formatDuration(durationMs)}).`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
