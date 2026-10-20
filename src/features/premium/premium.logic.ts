import { PermissionFlagsBits, Routes } from 'discord.js';
import config, { fillTemplate } from '../../core/config';
import { discordTimestamp, formatDuration, isDuration, parseDuration, MS_PER_DAY } from '../../core/format';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler, CommandOutcome } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import {
  grantGuildPremium,
  grantUserPremium,
  guildPremiumStatus,
  type GuildProfile,
  revokeGuildPremium,
  revokeUserPremium,
  setGuildProfileField,
  userPremiumStatus,
} from './premium.model';
import { EFFECT_IDS, FONT_IDS, styleHelpPayload } from './style.ui';

const DEFAULT_PREMIUM_DURATION = 30 * MS_PER_DAY;
const validId = /^\d{15,22}$/;

function extractId(raw: string | undefined): string | null {
  const id = raw?.replace(/[<@!>]/g, '');
  return id && validId.test(id) ? id : null;
}

async function usageFailure(ctx: Parameters<CommandHandler>[0], message: string): Promise<CommandOutcome> {
  return fail(ctx, message);
}

interface ParsedStyle {
  fontId: number;
  effectId: number;
  colors: number[];
}

function parseStyle(tokens: string[]): ParsedStyle | { error: string } {
  const colors: number[] = [];
  let fontId: number | null = null;
  let effectId: number | null = null;
  for (const raw of tokens) {
    const token = raw.toLowerCase();
    const [key, value] = token.includes(':') ? token.split(':') : [null, token];
    if (/^#?[0-9a-f]{6}$/.test(token)) colors.push(Number.parseInt(token.replace('#', ''), 16));
    else if (key === 'font' && value && (FONT_IDS[value] || /^\d+$/.test(value))) fontId = FONT_IDS[value] ?? Number(value);
    else if (key === 'effect' && value && (EFFECT_IDS[value] || /^\d+$/.test(value))) effectId = EFFECT_IDS[value] ?? Number(value);
    else if (!key && /^\d{1,2}$/.test(token)) {
      if (fontId === null) fontId = Number(token);
      else if (effectId === null) effectId = Number(token);
      else return { error: `I don't understand "${raw}".` };
    } else if (!key && EFFECT_IDS[token]) effectId = EFFECT_IDS[token];
    else if (!key && FONT_IDS[token]) fontId = FONT_IDS[token];
    else return { error: `I don't understand "${raw}".` };
  }
  if (!colors.length || colors.length > 2) return { error: 'Give one or two hex colors, like `ff00ff`.' };
  if (fontId === null) fontId = 11;
  if (effectId === null) effectId = colors.length === 2 ? 2 : 1;
  if (fontId < 1 || fontId > 12) return { error: 'The font must be between 1 and 12.' };
  if (effectId < 1 || effectId > 6) return { error: 'The effect must be between 1 and 6.' };
  if (effectId === 2 && colors.length < 2) return { error: 'The gradient effect needs two colors.' };
  return { fontId, effectId, colors };
}

export const premiumLogic = {
  async premiumGrant(ctx) {
    const [action, type, idRaw, durationRaw] = ctx.args;
    const id = extractId(idRaw) ?? (await ctx.findUser(2))?.id ?? null;
    if ((action !== 'add' && action !== 'remove') || (type !== 'user' && type !== 'server') || !id) {
      return usageFailure(ctx, `Say \`add\` or \`remove\`, \`user\` or \`server\`, and give a valid ID.\nUse: \`${ctx.prefix}premium add <user|server> <id> [duration]\`.\nUse: \`${ctx.prefix}premium remove <user|server> <id>\`.`);
    }
    if (action === 'remove') {
      const removed = type === 'server' ? await revokeGuildPremium(id) : await revokeUserPremium(id);
      await ctx.send(removed
        ? successReply(ctx, `- Removed the Premium subscription from ${type === 'server' ? `server \`${id}\`` : `<@${id}>`}.`)
        : errorReply(ctx, `${type === 'server' ? `Server \`${id}\`` : `<@${id}>`} does not have an active Premium subscription.`));
      return 'completed';
    }
    const durationMs = durationRaw !== undefined
      ? (isDuration(durationRaw) ? parseDuration(durationRaw, Number.NaN) : Number.NaN)
      : DEFAULT_PREMIUM_DURATION;
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      return usageFailure(ctx, `Give a valid duration.\nUse: \`${ctx.prefix}premium add <user|server> <id> [duration]\` (e.g. 30d).`);
    }
    const expiresAt = type === 'server'
      ? await grantGuildPremium(id, durationMs, ctx.user.id)
      : await grantUserPremium(id, durationMs, ctx.user.id);
    await ctx.send(successReply(ctx, [
      `- Gave ${type === 'server' ? `server \`${id}\`` : `<@${id}>`} **Premium**.`,
      `- Expires ${discordTimestamp(expiresAt)} (${formatDuration(durationMs)}).`,
    ].join('\n')));
    return 'completed';
  },

  async premiumSubscription(ctx) {
    const sub = ctx.args[0]?.toLowerCase();
    if (sub === 'server') {
      const guild = await requireGuild(ctx);
      if (!guild) return 'skipped';
      const id = extractId(ctx.args[1]) ?? guild.id;
      const status = await guildPremiumStatus(id);
      await ctx.send(successReply(ctx, status
        ? `- Server \`${id}\` has an active **Premium** subscription.\n- Expires ${discordTimestamp(status.expiresAt)}.`
        : `- Server \`${id}\` does not have an active **Premium** subscription.`));
      return 'completed';
    }
    const target = extractId(ctx.args[1]) ? await ctx.client.users.fetch(extractId(ctx.args[1])!).catch(() => null) : await ctx.targetUser(1);
    if (!target) return usageFailure(ctx, `Mention a member or give a valid user ID.\nUse: \`${ctx.prefix}subscription [user|server] [ID|@member]\`.`);
    const status = await userPremiumStatus(target.id);
    await ctx.send(successReply(ctx, status
      ? `- <@${target.id}> has an active **Premium** subscription.\n- Expires ${discordTimestamp(status.expiresAt)}.`
      : `- <@${target.id}> does not have an active **Premium** subscription.`));
    return 'completed';
  },

  async guildProfile(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const status = await guildPremiumStatus(guild.id);
    if (!status) {
      await ctx.send(errorReply(ctx, fillTemplate(config.messages.premiumRequired, { prefix: ctx.prefix })));
      return 'skipped';
    }
    const [fieldRaw, ...rest] = ctx.args;
    const field = fieldRaw?.toLowerCase();

    if (field === 'style') {
      if (['help', 'list'].includes(rest[0]?.toLowerCase() ?? '')) {
        const botName = ctx.client.user?.username ?? config.botName;
        await ctx.send(styleHelpPayload(ctx.user.id, botName, ctx.prefix, 0, guild.id));
        return 'completed';
      }
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ChangeNickname)) {
        return usageFailure(ctx, `I need the **Change Nickname** permission to change my name style.`);
      }
      const reset = rest[0]?.toLowerCase() === 'reset';
      let body: Record<string, unknown>;
      let summary: string;
      if (reset) {
        body = { display_name_font_id: null, display_name_effect_id: null, display_name_colors: null };
        summary = '- Reset the name style back to default.';
      } else {
        const parsed = parseStyle(rest);
        if ('error' in parsed) {
          return usageFailure(ctx, `${parsed.error}\nUse: \`${ctx.prefix}guildprofile style <color> [color2] [font] [effect]\`.\nUse \`${ctx.prefix}guildprofile style help\` to see every font and effect.`);
        }
        body = { display_name_font_id: parsed.fontId, display_name_effect_id: parsed.effectId, display_name_colors: parsed.colors };
        const shown = parsed.colors.map((c) => `\`#${c.toString(16).padStart(6, '0')}\``).join(' → ');
        summary = `- Updated the name style : ${shown}.`;
      }
      try {
        await ctx.client.rest.patch(Routes.guildMember(guild.id, '@me'), { body });
      } catch (error) {
        return usageFailure(ctx, `Discord refused it : ${error instanceof Error ? error.message : String(error)}`);
      }
      await ctx.send(successReply(ctx, summary));
      return 'completed';
    }

    const value = rest.join(' ').trim();
    if ((field !== 'name' && field !== 'avatar' && field !== 'banner' && field !== 'bio') || !value) {
      return usageFailure(ctx, `Say which field to set (\`name\`, \`avatar\`, \`banner\`, \`bio\` or \`style\`) and give a value.\nUse: \`${ctx.prefix}guildprofile <name|avatar|banner|bio|style> <value|reset>\`.`);
    }
    const profileField = field === 'avatar' ? 'avatarURL' : field === 'banner' ? 'bannerURL' : field;
    const reset = value.toLowerCase() === 'reset';
    const stored = reset ? null : value;
    if ((field === 'avatar' || field === 'banner') && !reset && !/^https?:\/\//i.test(value)) {
      return usageFailure(ctx, `Give a direct image URL, or \`reset\`.`);
    }
    await setGuildProfileField(guild.id, profileField as keyof GuildProfile, stored);
    try {
      if (field === 'name') await guild.members.me?.setNickname(stored);
    } catch (error) {
      console.error(`Applying guild profile ${field} failed:`, error);
    }
    await ctx.send(successReply(ctx, reset
      ? `- Reset the server's ${field} back to default.`
      : `- Updated the server's ${field}.`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
