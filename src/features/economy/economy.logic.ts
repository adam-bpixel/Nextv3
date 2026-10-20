import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import config from '../../core/config';
import { fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { loadWallet, saveWallet } from './wallet.model';

const EVERYTHING = /^(all|max)$/i;

const CRIME_SUCCESS_CHANCE = 0.5;
const CRIME_REWARD: readonly [number, number] = [100, 400];
const CRIME_FINE: readonly [number, number] = [50, 200];

const BEG_SUCCESS_CHANCE = 0.7;
const BEG_REWARD: readonly [number, number] = [1, 50];

const ROB_SUCCESS_CHANCE = 0.4;
const ROB_MIN_TARGET_WALLET = 50;
const ROB_MAX_STEAL_PERCENT = 0.4;
const ROB_FINE: readonly [number, number] = [1, 100];

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
    const accent = (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
    const container = new ContainerBuilder()
      .setAccentColor(accent)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${user.username}'s Balance`))
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent([
          `- Wallet: ${money(wallet.wallet)}`,
          `- Bank: ${money(wallet.bank)}`,
          `- Total: ${money(wallet.wallet + wallet.bank)}`,
        ].join('\n')),
      );
    await ctx.send({ components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
    return 'completed';
  },

  async daily(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + config.economy.daily });
    await ctx.send(successReply(ctx, `- Daily reward: ${money(config.economy.daily)}.\n- Come back tomorrow for another reward.`));
    return 'completed';
  },

  async work(ctx) {
    const [low, high] = config.economy.work;
    const earned = ctx.randInt(low, high);
    const wallet = await loadWallet(ctx.user.id);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + earned });
    await ctx.send(successReply(ctx, `- You worked and earned ${money(earned)}.`));
    return 'completed';
  },

  async deposit(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    const amount = amountOf(ctx.args[0], wallet.wallet);
    if (!amount) return fail(ctx, 'Give an amount (or `all`).');
    if (amount > wallet.wallet) return fail(ctx, `You only have ${money(wallet.wallet)} in your wallet.`);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet - amount, bank: wallet.bank + amount });
    await ctx.send(successReply(ctx, `- Deposited ${money(amount)} into your bank.`));
    return 'completed';
  },

  async withdraw(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    const amount = amountOf(ctx.args[0], wallet.bank);
    if (!amount) return fail(ctx, 'Give an amount (or `all`).');
    if (amount > wallet.bank) return fail(ctx, `You only have ${money(wallet.bank)} in the bank.`);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + amount, bank: wallet.bank - amount });
    await ctx.send(successReply(ctx, `- Withdrew ${money(amount)} from your bank.`));
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
    await ctx.send(successReply(ctx, `- Paid ${money(amount)} to <@${target.id}>.`));
    return 'completed';
  },

  async crime(ctx) {
    const wallet = await loadWallet(ctx.user.id);
    if (Math.random() < CRIME_SUCCESS_CHANCE) {
      const earned = ctx.randInt(...CRIME_REWARD);
      await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + earned });
      await ctx.send(successReply(ctx, `- Your crime paid off! You earned ${money(earned)}.`));
    } else {
      const fine = Math.min(wallet.wallet, ctx.randInt(...CRIME_FINE));
      await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet - fine });
      await ctx.send(errorReply(ctx, `- You got caught! You paid a ${money(fine)} fine.`));
    }
    return 'completed';
  },

  async beg(ctx) {
    if (Math.random() >= BEG_SUCCESS_CHANCE) {
      await ctx.send(errorReply(ctx, '- Nobody gave you anything this time.'));
      return 'completed';
    }
    const wallet = await loadWallet(ctx.user.id);
    const earned = ctx.randInt(...BEG_REWARD);
    await saveWallet(ctx.user.id, { ...wallet, wallet: wallet.wallet + earned });
    await ctx.send(successReply(ctx, `- A kind stranger gave you ${money(earned)}.`));
    return 'completed';
  },

  async rob(ctx) {
    const target = await ctx.findUser(0);
    if (!target || target.bot || target.id === ctx.user.id) return fail(ctx, 'Mention who to rob.');
    const targetWallet = await loadWallet(target.id);
    if (targetWallet.wallet < ROB_MIN_TARGET_WALLET) return fail(ctx, `<@${target.id}> doesn't have enough in their wallet to rob.`);
    const robberWallet = await loadWallet(ctx.user.id);
    if (Math.random() < ROB_SUCCESS_CHANCE) {
      const stolen = ctx.randInt(1, Math.max(1, Math.floor(targetWallet.wallet * ROB_MAX_STEAL_PERCENT)));
      await saveWallet(target.id, { ...targetWallet, wallet: targetWallet.wallet - stolen });
      await saveWallet(ctx.user.id, { ...robberWallet, wallet: robberWallet.wallet + stolen });
      await ctx.send(successReply(ctx, `- You robbed ${money(stolen)} from <@${target.id}>.`));
    } else {
      const fine = Math.min(robberWallet.wallet, ctx.randInt(...ROB_FINE));
      await saveWallet(ctx.user.id, { ...robberWallet, wallet: robberWallet.wallet - fine });
      await ctx.send(errorReply(ctx, `- You got caught trying to rob <@${target.id}> and paid a ${money(fine)} fine.`));
    }
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
