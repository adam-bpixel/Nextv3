import { ContainerBuilder } from 'discord.js';
import config from '../../core/config';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { requireGuild } from '../../core/replies';
import { sep, text as textDisplay, toPayload } from '../setup/setup.ui.shared';
import { addBotPanel } from './addBot.ui';
import {
  clearGuildAssignment,
  deleteFleetBot,
  findFleetBotByName,
  findFleetBotByToken,
  nextFleetBotId,
  saveFleetBot,
  setGuildAssignment,
} from '../fleet/fleet.model';
import { isFleetBotOnline, startFleetBot, stopFleetBot } from '../fleet/fleet.manager';
import { usageFailure } from './owner.logic.helpers';

const TOKEN_SHAPE = /^[\w-]{20,}\.[\w-]{4,}\.[\w-]{20,}$/;

export interface AddFleetBotResult {
  ok: boolean;
  message: string;
}

function parseLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/disallowedintents|privileged intent/i.test(message)) {
    return 'Discord rejected login: You must enable Privileged Gateway Intents (Presence, Server Members, Message Content) in the Discord Developer Portal for this bot.';
  }
  if (/improper token|an invalid token|unauthorized/i.test(message)) {
    return 'Discord rejected that token: The token is invalid or has been reset.';
  }
  return `Discord rejected login: ${message.slice(0, 200)}`;
}

export async function addFleetBotFromToken(token: string, name: string | undefined, addedBy: string): Promise<AddFleetBotResult> {
  if (!TOKEN_SHAPE.test(token)) return { ok: false, message: "That doesn't look like a valid bot token." };

  const existing = await findFleetBotByToken(token);
  if (existing) {
    if (isFleetBotOnline(existing.id)) return { ok: false, message: `That bot is already registered and online as **${existing.name}** (#${existing.id}).` };
    try {
      const client = await startFleetBot(existing);
      return { ok: true, message: `- Reconnected **${client.user?.tag ?? existing.name}** (#${existing.id}).` };
    } catch (error) {
      console.error(`Failed to reconnect fleet bot "${existing.name}":`, error);
      return { ok: false, message: parseLoginErrorMessage(error) };
    }
  }

  const id = await nextFleetBotId();
  const bot = { id, token, name: name ?? `bot-${id}`, addedBy, addedAt: Date.now(), status: 'offline' as const };
  await saveFleetBot(bot);
  try {
    const client = await startFleetBot(bot);
    await saveFleetBot({ ...bot, name: client.user?.tag ?? bot.name, status: 'online' });
    return { ok: true, message: `- Added and logged in as **${client.user?.tag ?? bot.name}** (#${id}).` };
  } catch (error) {
    console.error(`Failed to start fleet bot "${bot.name}":`, error);
    await deleteFleetBot(id);
    return { ok: false, message: parseLoginErrorMessage(error) };
  }
}

export const ownerFleetLogic = {
  async ownerAddBot(ctx) {
    await ctx.send(addBotPanel());
    return 'completed';
  },

  async ownerRemoveBot(ctx) {
    const query = ctx.args.join(' ');
    if (!query) return usageFailure(ctx, `Give the bot's ID or name.\nUse: \`${ctx.prefix}removebot <bot id or name>\`.`);
    const bot = await findFleetBotByName(query);
    if (!bot) {
      await ctx.send(errorReply(ctx, `No managed bot matches \`${query}\`.`));
      return 'skipped';
    }
    await stopFleetBot(bot.id);
    await deleteFleetBot(bot.id);
    await ctx.send(successReply(ctx, `- Removed **${bot.name}** (#${bot.id}) and deleted its saved token.`));
    return 'completed';
  },

  async ownerKillBot(ctx) {
    const query = ctx.args.join(' ');
    if (!query) return usageFailure(ctx, `Give the bot's ID or name.\nUse: \`${ctx.prefix}killbot <bot id or name>\`.`);
    const bot = await findFleetBotByName(query);
    if (!bot) {
      await ctx.send(errorReply(ctx, `No managed bot matches \`${query}\`.`));
      return 'skipped';
    }
    const stopped = await stopFleetBot(bot.id);
    await ctx.send(successReply(ctx, stopped
      ? `- Stopped **${bot.name}** (#${bot.id}). Its token is still saved; use \`${ctx.prefix}addbot\` with the same token to bring it back.`
      : `- **${bot.name}** (#${bot.id}) was already offline.`));
    return 'completed';
  },

  async ownerUseBot(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const query = ctx.args.join(' ');
    if (!query) return usageFailure(ctx, `Give the bot's ID or name, or \`main\`.\nUse: \`${ctx.prefix}usebot <bot id or name|main> [this server]\`.`);

    if (query.toLowerCase() === 'main') {
      await clearGuildAssignment(guild.id);
      await ctx.send(successReply(ctx, `- The main bot will now answer commands in **${guild.name}**.`));
      return 'completed';
    }

    const bot = await findFleetBotByName(query);
    if (!bot) {
      await ctx.send(errorReply(ctx, `No managed bot matches \`${query}\`. Use \`${ctx.prefix}usebot main\` to reset to the main bot.`));
      return 'skipped';
    }
    if (!isFleetBotOnline(bot.id)) {
      await ctx.send(errorReply(ctx, `**${bot.name}** (#${bot.id}) isn't online right now. Use \`${ctx.prefix}addbot\` with its token to bring it back first.`));
      return 'skipped';
    }
    await setGuildAssignment(guild.id, bot.id);
    await ctx.send(successReply(ctx, `- **${bot.name}** (#${bot.id}) will now answer commands in **${guild.name}**.`));
    return 'completed';
  },

  async ownerAnnounce(ctx) {
    const message = ctx.text;
    if (!message) return usageFailure(ctx, `Give the message to send.\nUse: \`${ctx.prefix}announecement <message>\`.`);

    const container = new ContainerBuilder()
      .setAccentColor(config.color)
      .addTextDisplayComponents(textDisplay('## Announcement'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(textDisplay(message));
    const payload = toPayload(container);

    const owners = new Map<string, string>();
    for (const guild of ctx.client.guilds.cache.values()) owners.set(guild.ownerId, guild.name);

    let sent = 0;
    let failed = 0;
    for (const ownerId of owners.keys()) {
      const user = await ctx.client.users.fetch(ownerId).catch(() => null);
      const delivered = user ? await user.send(payload).then(() => true).catch(() => false) : false;
      if (delivered) sent += 1;
      else failed += 1;
    }
    await ctx.send(successReply(ctx, `- Sent to **${sent}** server owner(s).${failed ? ` **${failed}** couldn't be reached.` : ''}`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
