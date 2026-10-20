import config, { fillTemplate } from './config';
import { getCooldown } from './cooldowns';
import db from './db';
import { permissionLabel } from './permissions';
import { runAiLogic } from '../features/ai/ai.runner';
import { logicHandler } from '../features/logic';
import { replayCommand } from '../features/recordings/recordings.service';
import { recordCommandUse } from '../features/stats/commandStats.model';
import type { Ctx } from './context';
import { commandLabel, type CommandOutcome, type LoadedCommand } from './types';
import { errorReply } from './usage-replies';
import { getBlacklistEntry, isWorkMode } from '../features/owner/owner.model';
import { isBlacklistedChannel } from '../features/setup/setup.model.blacklist';
import { getCheckerRoles } from '../features/setup/setup.model.checker';

const COOLDOWNS_COLLECTION = 'cooldowns';
const MS_PER_SECOND = 1000;

const cooldownKey = (command: LoadedCommand, userId: string): string => `${command.recordingFile || commandLabel(command)}:${userId}`;

async function cooldownEndsAt(command: LoadedCommand, userId: string): Promise<number> {
  const stored = await db.get(COOLDOWNS_COLLECTION, cooldownKey(command, userId));
  return typeof stored === 'number' ? stored : 0;
}

async function perform(ctx: Ctx, command: LoadedCommand): Promise<CommandOutcome> {
  if (command.execute) {
    const result = await command.execute(ctx);
    return result === 'skipped' ? 'skipped' : 'completed';
  }
  if (command.logic) return logicHandler(command.logic)(ctx);
  if (command.ai) {
    const outcome = await runAiLogic(command.ai, ctx);
    if (outcome) return outcome;
  }
  return replayCommand(ctx, command);
}

function isInVoice(ctx: Ctx): boolean {
  return Boolean(ctx.member?.voice.channelId);
}

export async function run(ctx: Ctx, command: LoadedCommand): Promise<void> {
  try {
    if (ctx.user.id !== config.ownerId) {
      if (await isWorkMode()) {
        if (ctx.isInteraction) await ctx.send(errorReply(ctx, 'The bot is currently in owner work mode.'));
        return;
      }
      const blocked = await getBlacklistEntry(ctx.user.id);
      if (blocked) {
        await ctx.send(errorReply(ctx, `You cannot use the bot's commands.\n- Reason: ${blocked.reason}`));
        return;
      }
    }
    if (ctx.inDM && !command.dm) {
      if (ctx.isInteraction) await ctx.send(errorReply(ctx, config.messages.serverOnly));
      return;
    }
    if (ctx.guild && ctx.channel && ctx.user.id !== config.ownerId && await isBlacklistedChannel(ctx.guild.id, ctx.channel.id)) {
      if (ctx.isInteraction) await ctx.send(errorReply(ctx, 'Bot commands are disabled in this channel.'));
      return;
    }
    if (command.ownerOnly && ctx.user.id !== config.ownerId) {
      await ctx.send(errorReply(ctx, config.messages.ownerOnly));
      return;
    }
    const missing = command.permissions.filter((permission) => !ctx.hasPermission(permission));
    if (missing.length) {
      const permission = missing.map(permissionLabel).join(', ');
      await ctx.send(errorReply(ctx, fillTemplate(config.messages.missingPermission, { permission })));
      return;
    }
    if ('category' in command && command.category === 'Checker' && ctx.guild && ctx.user.id !== config.ownerId && !ctx.hasPermission('administrator')) {
      const checkerRoleIds = await getCheckerRoles(ctx.guild.id);
      if (checkerRoleIds.length && !checkerRoleIds.some((id) => ctx.member?.roles.cache.has(id) ?? false)) {
        await ctx.send(errorReply(ctx, "You don't have permission to use checker commands."));
        return;
      }
    }
    if (command.voice && !isInVoice(ctx)) {
      await ctx.send(errorReply(ctx, config.messages.joinVoice));
      return;
    }
    const cooldown = getCooldown(commandLabel(command), command.cooldown);
    if (cooldown) {
      const until = await cooldownEndsAt(command, ctx.user.id);
      if (until > Date.now()) {
        await ctx.send(errorReply(ctx, fillTemplate(config.messages.cooldown, { time: `<t:${Math.ceil(until / MS_PER_SECOND)}:R>` })));
        return;
      }
    }
    const outcome = await perform(ctx, command);
    if (outcome !== 'skipped') {
      if (cooldown) await db.set(COOLDOWNS_COLLECTION, cooldownKey(command, ctx.user.id), Date.now() + cooldown * MS_PER_SECOND);
      await recordCommandUse(ctx.user.id);
    }
  } catch (error) {
    console.error(`Command "${commandLabel(command)}" failed:`, error);
    await ctx.send(errorReply(ctx, config.messages.error)).catch(() => undefined);
  }
}
