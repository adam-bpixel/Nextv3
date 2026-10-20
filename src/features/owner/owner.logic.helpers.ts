import { ChannelType, type Channel, type SendableChannels } from 'discord.js';
import config from '../../core/config';
import type { CommandHandler } from '../../core/types';
import { errorReply, usageReply } from '../../core/usage-replies';

export const validId = /^\d{15,22}$/;

export const positiveAmount = (raw: string | undefined): number | null => {
  const amount = Number(raw);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
};

export const money = (amount: number): string => `**${amount.toLocaleString('en-US')}** ${config.economy.currency}`;

export const randomBetween = (minimum: number, maximum: number): number => minimum + Math.floor(Math.random() * (maximum - minimum + 1));

export async function targetFrom(ctx: Parameters<CommandHandler>[0], index = 0) {
  const target = await ctx.findUser(index);
  if (target) return target;
  const id = ctx.args[index]?.replace(/[<@!>]/g, '');
  return id && validId.test(id) ? ctx.client.users.fetch(id).catch(() => null) : null;
}

export function ownerUsage(ctx: Parameters<CommandHandler>[0], command: string, details: string): Promise<unknown> {
  return ctx.send(usageReply(ctx, `Use: \`${ctx.prefix}${command} ${details}\`.`));
}

export function profileShopUsage(ctx: Parameters<CommandHandler>[0]): Promise<unknown> {
  return ctx.send(usageReply(ctx, [
    `Use: \`${ctx.prefix}prshop add <profile id> <name> <price> <stock|unlimited>\`.`,
    `Use: \`${ctx.prefix}prshop edit <profile id> <name|price|stock> <value>\`.`,
    `Use: \`${ctx.prefix}prshop remove <profile id>\`.`,
  ].join('\n')));
}

export async function usageFailure(ctx: Parameters<CommandHandler>[0], message: string): Promise<'skipped'> {
  await ctx.send(usageReply(ctx, message));
  return 'skipped';
}

export async function errorFailure(ctx: Parameters<CommandHandler>[0], message: string): Promise<'skipped'> {
  await ctx.send(errorReply(ctx, message));
  return 'skipped';
}

export function isTextChannel(channel: Channel | null): channel is SendableChannels {
  return Boolean(channel && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement));
}

export function parseShopStock(raw: string | undefined): number | null {
  if (raw === '-1' || raw?.toLowerCase() === 'unlimited') return -1;
  return raw !== undefined ? Number.isSafeInteger(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null : null;
}
