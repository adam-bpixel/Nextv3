import { fail } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import type { Ctx } from '../../core/context';
import { ActivityType, type User } from 'discord.js';
import { findGuildAdmins, findGuildBots } from './adminAudit';
import { getMutualGuilds } from './mutualGuilds';
import { findVoiceLocations, getMyServerRank, getVoiceLeaderboard } from './voiceActivity';
import { resolveTarget } from './userSearch';
import * as ui from './checker.ui';
import { ensureLoggedIn, isConfigured } from './selfbot';
import type { UserPresenceData } from './checker.ui';
import { cloneEmojis, cloneSoundboard, cloneStickers } from './cloneAssets.logic';

const USAGE = 'Mention a user, give their ID, or part of their username.';
const NOT_FOUND = "I couldn't find that user.";

function timestampToMilliseconds(value: unknown): number | null {
  if (value instanceof Date) {
    const milliseconds = value.getTime();
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }

  const numericValue = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

  // Discord activity timestamps are usually milliseconds, but tolerate Unix seconds too.
  return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
}

// The selfbot client (discord.js-selfbot-v13) reports activity.type as a string
// ("PLAYING"/"LISTENING"/...) instead of discord.js's numeric ActivityType enum.
const SELFBOT_ACTIVITY_TYPES: Record<string, number> = {
  PLAYING: ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  LISTENING: ActivityType.Listening,
  WATCHING: ActivityType.Watching,
  CUSTOM: ActivityType.Custom,
  COMPETING: ActivityType.Competing,
};

function normalizeActivityType(type: unknown): number {
  if (typeof type === 'number') return type;
  if (typeof type === 'string') return SELFBOT_ACTIVITY_TYPES[type] ?? ActivityType.Playing;
  return ActivityType.Playing;
}

async function findPresence(ctx: Ctx, userId: string): Promise<UserPresenceData | null> {
  const botPresence = [...ctx.client.guilds.cache.values()]
    .map((guild) => guild.presences.cache.get(userId))
    .find((presence) => presence !== undefined);

  if (botPresence) {
    return {
      status: botPresence.status,
      clientStatus: botPresence.clientStatus,
      activities: botPresence.activities.map((activity) => ({
        type: activity.type,
        name: activity.name,
        state: activity.state,
        details: activity.details,
        imageUrl: activity.assets?.largeImageURL() ?? activity.assets?.smallImageURL() ?? null,
        startTimestamp: timestampToMilliseconds(activity.timestamps?.start),
        endTimestamp: timestampToMilliseconds(activity.timestamps?.end),
      })),
    };
  }

  if (!isConfigured()) return null;
  const self = await ensureLoggedIn().catch(() => null);
  const selfPresence = self && [...self.guilds.cache.values()]
    .map((guild) => guild.presences.cache.get(userId))
    .find((presence) => presence !== undefined);

  if (!selfPresence) return null;
  return {
    status: selfPresence.status,
    clientStatus: selfPresence.clientStatus,
    activities: selfPresence.activities.map((activity) => ({
      type: normalizeActivityType(activity.type),
      name: activity.name,
      state: activity.state,
      details: activity.details,
      imageUrl: activity.assets.largeImageURL() ?? activity.assets.smallImageURL() ?? null,
      startTimestamp: timestampToMilliseconds(activity.timestamps?.start),
      endTimestamp: timestampToMilliseconds(activity.timestamps?.end),
    })),
  };
}

async function resolveUserOrFail(ctx: Ctx): Promise<User | null> {
  if (ctx.args.length === 0) {
    await fail(ctx, USAGE);
    return null;
  }
  const user = await resolveTarget(ctx);
  if (!user) await fail(ctx, NOT_FOUND);
  return user;
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

  async activity(ctx) {
    const user = await resolveUserOrFail(ctx);
    if (!user) return 'skipped';
    const presence = await findPresence(ctx, user.id);
    await ctx.send(await ui.activityPage(user, presence));
    return 'completed';
  },

  async topma(ctx) {
    const entries = await getVoiceLeaderboard(ctx.client);
    const pageData = await ui.topVoicePage(entries, 0, ctx.user.id);
    const message = await ctx.send(pageData);
    ui.cacheTopmaPageUrl(ctx.user.id, pageData.page, message);
    return 'completed';
  },

  async myserver(ctx) {
    if (!ctx.guild) return fail(ctx, 'Run this inside a server to see its image.');
    const { entry, rankNumber, totalRanked } = await getMyServerRank(ctx.client, ctx.guild);
    await ctx.send(await ui.myServerBannerPage(entry, rankNumber, totalRanked));
    return 'completed';
  },

  async listadmins(ctx) {
    const rawArg = ctx.args[0]?.replace(/[<@!&#>]/g, '').trim() ?? '';
    const guildId = /^\d{15,22}$/.test(rawArg) ? rawArg : ctx.guild?.id;
    if (!guildId) return fail(ctx, 'Give a server ID, or run this inside a server.');

    const audit = await findGuildAdmins(ctx.client, guildId);
    if (!audit) return fail(ctx, "I couldn't find that server.");

    await ctx.send(ui.listAdminsPage(audit, 0, ctx.user.id));
    return 'completed';
  },

  async listbots(ctx) {
    const rawArg = ctx.args[0]?.replace(/[<@!&#>]/g, '').trim() ?? '';
    const guildId = /^\d{15,22}$/.test(rawArg) ? rawArg : ctx.guild?.id;
    if (!guildId) return fail(ctx, 'Give a server ID, or run this inside a server.');

    const audit = await findGuildBots(ctx.client, guildId);
    if (!audit) return fail(ctx, "I couldn't find that server.");

    await ctx.send(ui.listBotsPage(audit, 0, ctx.user.id));
    return 'completed';
  },

  cloneemojis: cloneEmojis,
  clonestickers: cloneStickers,
  clonesoundboard: cloneSoundboard,
} satisfies Record<string, CommandHandler>;
