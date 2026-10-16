import { fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import type { Ctx, ReplyPayload } from '../../core/context';
import type { User } from 'discord.js';
import { getMutualGuilds } from './mutualGuilds';
import { findVoiceLocations, getVoiceLeaderboard } from './voiceActivity';
import { resolveTarget } from './userSearch';
import * as ui from './checker.ui';

const USAGE = 'Mention a user, give their ID, or part of their username.';
const NOT_FOUND = "I couldn't find that user.";
const SEND_ATTEMPTS = 2;

async function resolveUserOrFail(ctx: Ctx): Promise<User | null> {
  if (ctx.args.length === 0) {
    await fail(ctx, USAGE);
    return null;
  }
  const user = await resolveTarget(ctx);
  if (!user) await fail(ctx, NOT_FOUND);
  return user;
}

const isAbortError = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError';

async function sendWithRetry(ctx: Ctx, payload: ReplyPayload): Promise<void> {
  for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt++) {
    try {
      await ctx.send(payload);
      return;
    } catch (error) {
      if (attempt === SEND_ATTEMPTS || !isAbortError(error)) throw error;
    }
  }
}

export const checkerLogic = {
  async checkroles(ctx) {
    const user = await resolveUserOrFail(ctx);
    if (!user) return 'skipped';
    const entries = await getMutualGuilds(ctx.client, user.id);
    const dangerous = entries.filter((entry) => entry.dangerous.length > 0);
    if (!dangerous.length) return fail(ctx, `No dangerous roles found for ${user.tag} in any shared server.`);
    await ctx.send(ui.rolesCheckPage(user, dangerous, 0, ctx.user.id));
    return 'completed';
  },

  async fullcheck(ctx) {
    const user = await resolveUserOrFail(ctx);
    if (!user) return 'skipped';
    const entries = await getMutualGuilds(ctx.client, user.id);
    if (!entries.length) return fail(ctx, `No shared servers found for ${user.tag}.`);
    await ctx.send(ui.fullCheckPage(user, entries, 0, ctx.user.id));
    return 'completed';
  },

  async checkvoice(ctx) {
    const user = await resolveUserOrFail(ctx);
    if (!user) return 'skipped';
    const locations = await findVoiceLocations(ctx.client, user.id);
    await ctx.send(ui.voiceCheckPage(user, locations, 0, ctx.user.id));
    return 'completed';
  },

  async topmembers(ctx) {
    const entries = await getVoiceLeaderboard(ctx.client);
    await sendWithRetry(ctx, await ui.topVoicePage(entries));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
