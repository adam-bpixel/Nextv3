import config, { fillTemplate } from './config';
import db from './db';
import { permissionLabel } from './permissions';
import { runAiLogic } from '../features/ai/ai.runner';
import { logicHandler } from '../features/logic';
import { replayCommand, sendReplies } from '../features/recordings/recordings.service';
import type { Ctx } from './context';
import type { Snapshot } from '../features/recordings/recording.model';
import { commandLabel, type CommandOutcome, type LoadedCommand } from './types';

const COOLDOWNS_COLLECTION = 'cooldowns';
const MS_PER_SECOND = 1000;

async function notice(ctx: Ctx, recorded: Snapshot[], fallback: string): Promise<void> {
  if (recorded.length && (await sendReplies(ctx, recorded))) return;
  await ctx.whisper(fallback);
}

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
    const { recording } = command;
    if (ctx.inDM && !command.dm) {
      if (ctx.isInteraction) await ctx.whisper(config.messages.serverOnly);
      return;
    }
    if (command.ownerOnly && ctx.user.id !== config.ownerId) {
      await notice(ctx, recording.permissionNotice, config.messages.ownerOnly);
      return;
    }
    const missing = command.permissions.filter((permission) => !ctx.hasPermission(permission));
    if (missing.length) {
      const permission = missing.map(permissionLabel).join(', ');
      await notice(ctx, recording.permissionNotice, fillTemplate(config.messages.missingPermission, { permission }));
      return;
    }
    if (command.voice && !isInVoice(ctx)) {
      await notice(ctx, recording.voiceNotice, config.messages.joinVoice);
      return;
    }
    if (command.cooldown) {
      const until = await cooldownEndsAt(command, ctx.user.id);
      if (until > Date.now()) {
        await ctx.whisper(fillTemplate(config.messages.cooldown, { time: `<t:${Math.ceil(until / MS_PER_SECOND)}:R>` }));
        return;
      }
    }
    const outcome = await perform(ctx, command);
    if (command.cooldown && outcome !== 'skipped') {
      await db.set(COOLDOWNS_COLLECTION, cooldownKey(command, ctx.user.id), Date.now() + command.cooldown * MS_PER_SECOND);
    }
  } catch (error) {
    console.error(`Command "${commandLabel(command)}" failed:`, error);
    await ctx.whisper(config.messages.error).catch(() => undefined);
  }
}
