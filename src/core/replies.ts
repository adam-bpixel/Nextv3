import type { Guild } from 'discord.js';
import config from './config';
import type { Ctx } from './context';
import type { CommandOutcome } from './types';

export async function requireGuild(ctx: Ctx): Promise<Guild | null> {
  if (ctx.guild) return ctx.guild;
  await ctx.whisper(config.messages.serverOnly);
  return null;
}

export async function fail(ctx: Ctx, text: string): Promise<CommandOutcome> {
  await ctx.whisper(`⚠️ ${text}`);
  return 'skipped';
}
