import type { Message, MessageComponentInteraction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import config from '../../core/config';
import * as state from '../../core/state';
import { makeContext, pickRandom, type Ctx } from '../../core/context';
import type { CommandOutcome, LoadedCommand } from '../../core/types';
import { allFlows, flowById, mention } from './flows.model';
import type { Flow, Snapshot, Source, Transition } from './recording.model';
import { buildEdit, buildMessage, buildModal, isEmpty, tokensOf, type Tokens } from './recordings.ui';

function flowFor(snapshot: Snapshot, source: Source | null): Flow | null {
  if (!source) return null;
  if (snapshot.primary && source.flow) return source.flow;
  if (snapshot.flowRef !== null) return source.extraFlows[snapshot.flowRef] ?? null;
  return null;
}

export async function sendReplies(ctx: Ctx, replies: readonly Snapshot[], source: Source | null = null): Promise<boolean> {
  const tokens = tokensOf(ctx);
  let sentAny = false;
  for (const snapshot of replies) {
    const flow = flowFor(snapshot, source);
    const payload = buildMessage(snapshot, tokens, flow);
    if (isEmpty(payload)) continue;
    if (snapshot.ephemeral && ctx.isInteraction) payload.flags = (payload.flags ?? 0) | MessageFlags.Ephemeral;
    const sent = await ctx.send(payload, { reply: snapshot.reply, ping: snapshot.ping });
    sentAny = true;
    if (flow) await state.set(sent.id, flow.id, flow.start);
  }
  return sentAny;
}

async function react(ctx: Ctx, emojis: readonly string[]): Promise<void> {
  if (ctx.source.kind !== 'message') return;
  for (const emoji of emojis) await ctx.source.message.react(emoji).catch(() => undefined);
}

function usedOptionalSlashOption(ctx: Ctx, command: LoadedCommand): boolean {
  if (ctx.source.kind !== 'command' || !('options' in command)) return false;
  const { interaction } = ctx.source;
  return command.options.some((option) => !option.required && interaction.options.get(option.name, false) !== null);
}

function pickSource(ctx: Ctx, command: LoadedCommand): Source {
  const { recording } = command;
  if (ctx.isInteraction) {
    const [firstVariant] = recording.variants;
    return usedOptionalSlashOption(ctx, command) && firstVariant ? firstVariant : recording;
  }
  if (ctx.args.length && recording.variants.length) {
    const [bestFit] = recording.variants.filter((variant) => variant.args <= ctx.args.length).sort((a, b) => b.args - a.args);
    if (bestFit) return bestFit;
  }
  const samples: Source[] = recording.samples.map((replies) => ({ replies, reactions: [], flow: null, extraFlows: [], args: 0 }));
  return pickRandom<Source>([recording, ...samples]);
}

const outcomeOf = (sent: boolean): CommandOutcome => (sent ? 'completed' : 'skipped');

export async function replayCommand(ctx: Ctx, command: LoadedCommand): Promise<CommandOutcome> {
  const { recording } = command;
  const asked = (ctx.args[0] ?? '').toLowerCase();
  const detail = asked ? recording.details.get(asked) : undefined;
  if (detail) return outcomeOf(await sendReplies(ctx, detail));
  if (command.kind === 'permission') {
    await ctx.whisper(config.messages.notRecorded);
    return 'completed';
  }
  const source = pickSource(ctx, command);
  await react(ctx, source.reactions);
  const sent = await sendReplies(ctx, source.replies, source);
  if (!sent && ctx.isInteraction) await ctx.whisper(config.messages.noAnswer);
  return outcomeOf(sent);
}

export async function replayMention(message: Message): Promise<boolean> {
  const recording = mention();
  if (!recording.replies.length) return false;
  const ctx = makeContext({ kind: 'message', message });
  await react(ctx, recording.reactions);
  return sendReplies(ctx, recording.replies, recording);
}

function findTransition(flow: Flow, stateId: string | null, interaction: MessageComponentInteraction): Transition | null {
  const value = interaction.isStringSelectMenu() ? interaction.values[0] : null;
  const matches = flow.transitions.filter((transition) => transition.customId === interaction.customId && transition.value === value);
  return matches.find((transition) => transition.from === stateId) ?? matches.find((transition) => transition.global) ?? matches[0] ?? null;
}

function locateTransition(interaction: MessageComponentInteraction): { flow: Flow; transition: Transition } | null {
  const known = state.get(interaction.message.id);
  const knownFlow = known ? flowById(known.flow) : null;
  const candidates = knownFlow ? [knownFlow, ...allFlows()] : allFlows();
  for (const candidate of candidates) {
    const stateId = known && candidate === knownFlow ? known.state : null;
    const transition = findTransition(candidate, stateId, interaction);
    if (transition) return { flow: candidate, transition };
  }
  return null;
}

function stateSnapshot(flow: Flow, stateId: string): Snapshot {
  const snapshot = flow.states.get(stateId);
  if (!snapshot) throw new Error(`Flow ${flow.id} has no state "${stateId}"`);
  return snapshot;
}

async function sendTransitionReply(ctx: Ctx, transition: Transition, tokens: Tokens): Promise<boolean> {
  const { replyFlow } = transition;
  let flowAssigned = false;
  let sentAny = false;
  for (const snapshot of transition.reply) {
    const carriesFlow = replyFlow !== null && !flowAssigned && snapshot.components.length > 0;
    const payload = buildMessage(snapshot, tokens, carriesFlow ? replyFlow : null);
    if (isEmpty(payload)) continue;
    const sent = await ctx.send(payload);
    sentAny = true;
    if (carriesFlow) {
      await state.set(sent.id, replyFlow.id, replyFlow.start);
      flowAssigned = true;
    }
  }
  return sentAny;
}

export async function handleComponent(interaction: MessageComponentInteraction): Promise<void> {
  const located = locateTransition(interaction);
  if (!located) {
    await interaction.deferUpdate();
    return;
  }
  const { flow, transition } = located;
  const ctx = makeContext({ kind: 'component', interaction });
  const tokens = tokensOf(ctx);
  if (transition.kind === 'update' && transition.to) {
    await interaction.update(buildEdit(stateSnapshot(flow, transition.to), tokens, flow));
    await state.set(interaction.message.id, flow.id, transition.to);
  } else if (transition.kind === 'reply') {
    if (!(await sendTransitionReply(ctx, transition, tokens))) await interaction.deferUpdate();
  } else if (transition.kind === 'modal' && transition.modal) {
    await interaction.showModal(buildModal(transition.modal, tokens));
  } else {
    await interaction.deferUpdate();
  }
}
