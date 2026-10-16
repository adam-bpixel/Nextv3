import config from '../../core/config';
import { fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { loadWallet, richest, saveWallet } from './wallet.model';

const LEADERBOARD_SIZE = 10;
const EVERYTHING = /^(all|max)$/i;

const money = (amount: number): string => `**${Number(amount).toLocaleString('en-US')}** ${config.economy.currency}`;

function amountOf(text: string | undefined, available: number): number | null {
  if (EVERYTHING.test(text ?? '')) return available;
  const amount = Number.parseInt(text ?? '', 10);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export const economyLogic = {
  async balance(ctx) {
    const user = await ctx.targetUser();
    const wallet = await loadWallet(user.id);
    await ctx.send(
      ctx.embed({
        title: `${user.username}'s balance`,
        fields: [
          { name: 'Wallet', value: money(wallet.wallet), inline: true },
          { name: 'Bank', value: money(wallet.bank), inline: true },
          { name: 'Total', value: money(wallet.wallet + wallet.bank), inline: true },
        ],
      }),
    );
    return 'completed';
  },

  async daily(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + config.economy.daily });
    await ctx.send(ctx.embed({ title: '📅 Daily reward', description: `You got ${money(config.economy.daily)}! Come back tomorrow.` }));
    return 'completed';
  },

  async work(ctx) {
    const [low, high] = config.economy.work;
    const earned = ctx.randInt(low, high);
    const wallet = await loadWallet(ctx.user.id);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + earned });
    await ctx.send(ctx.embed({ title: '💼 Work', description: `You worked hard and earned ${money(earned)}.` }));
    return 'completed';
  },

  async deposit(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    const amount = amountOf(ctx.args[0], wallet.wallet);
    if (!amount) return fail(ctx, 'Give an amount (or `all`).');
    if (amount > wallet.wallet) return fail(ctx, `You only have ${money(wallet.wallet)} in your wallet.`);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet - amount, bank: wallet.bank + amount });
    await ctx.send(ctx.embed({ description: `🏦 Deposited ${money(amount)}.` }));
    return 'completed';
  },

  async withdraw(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    const amount = amountOf(ctx.args[0], wallet.bank);
    if (!amount) return fail(ctx, 'Give an amount (or `all`).');
    if (amount > wallet.bank) return fail(ctx, `You only have ${money(wallet.bank)} in the bank.`);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + amount, bank: wallet.bank - amount });
    await ctx.send(ctx.embed({ description: `💵 Withdrew ${money(amount)}.` }));
    return 'completed';
  },

  async pay(ctx) {
    const target = await ctx.findUser(0);
    if (!target || target.bot || target.id === ctx.user.id) return fail(ctx, 'Mention who to pay.');
    const from = await loadWallet(ctx.user.id);
    const amount = amountOf(ctx.args[1], from.wallet);
    if (!amount) return fail(ctx, 'Give an amount to pay.');
    if (amount > from.wallet) return fail(ctx, `You only have ${money(from.wallet)} in your wallet.`);
    const to = await loadWallet(target.id);
    await saveWallet(ctx.user.id, { ...from, wallet: from.wallet - amount });
    await saveWallet(target.id, { ...to, wallet: to.wallet + amount });
    await ctx.send(ctx.embed({ description: `💸 You paid <@${target.id}> ${money(amount)}.` }));
    return 'completed';
  },

  async leaderboard(ctx) {
    const top = await richest(LEADERBOARD_SIZE);
    const lines = top.map((entry, index) => `**${index + 1}.** <@${entry.userId}> — ${money(entry.wallet.total)}`);
    await ctx.send(ctx.embed({ title: '🏆 Richest users', description: lines.join('\n') || 'Nobody has any money yet.' }));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
