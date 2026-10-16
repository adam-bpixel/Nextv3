import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';
import type { BaseInteraction } from 'discord.js';
import { matchingRoutes } from '../src/core/router';
import { isRecord } from '../src/core/json';
import { buildMessage, type Tokens } from '../src/features/recordings/recordings.ui';
import { flowsOf, type Recording, type Snapshot } from '../src/features/recordings/recording.model';
import { fakeButton, fakeChatInput, fakeModalSubmit, fakeStringSelect } from './support/interactions';
import { SRC_DIR, listFiles, loadBot } from './support/project';

const CUSTOM_ID_PROPERTY_NAMES = new Set(['custom_id', 'customId']);
const CUSTOM_ID_SETTERS = new Set(['setCustomId']);
const SAMPLE_TOKENS: Tokens = { mention: '<@1>', username: 'u', displayName: 'u', userId: '1', avatar: 'https://example.com/a.png', guild: 'g' };

function customIdLiteralsInSource(): string[] {
  const found: string[] = [];
  for (const file of listFiles(SRC_DIR, /\.ts$/)) {
    const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && CUSTOM_ID_PROPERTY_NAMES.has(node.name.text) && ts.isStringLiteralLike(node.initializer)) {
        found.push(node.initializer.text);
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && CUSTOM_ID_SETTERS.has(node.expression.name.text)) {
        const [first] = node.arguments;
        if (first && ts.isStringLiteralLike(first)) found.push(first.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return found;
}

function recordedSnapshots(recording: Recording): Snapshot[] {
  const sources = [recording, ...recording.variants];
  return [
    ...sources.flatMap((source) => source.replies),
    ...recording.samples.flat(),
    ...[...recording.details.values()].flat(),
    ...recording.voiceNotice,
    ...recording.permissionNotice,
    ...flowsOf(recording).flatMap((flow) => [...flow.states.values(), ...flow.transitions.flatMap((transition) => transition.reply)]),
  ];
}

function enabledCustomIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item: unknown) => enabledCustomIds(item));
  if (!isRecord(value)) return [];
  const own = typeof value.custom_id === 'string' && value.disabled !== true ? [value.custom_id] : [];
  return [...own, ...Object.values(value).flatMap(enabledCustomIds)];
}

function interactionsFor(customId: string): BaseInteraction[] {
  const { client } = loadBot();
  return [fakeButton(client, customId), fakeStringSelect(client, customId, ['sample']), fakeModalSubmit(client, customId)];
}

describe('interaction routes', () => {
  it('have unique names', () => {
    const names = loadBot().routes.map((route) => route.name);
    assert.equal(new Set(names).size, names.length);
  });

  it('send slash commands to the command route only', () => {
    const { client, routes } = loadBot();
    const matched = matchingRoutes(routes, fakeChatInput(client, 'cmdtimeout')).map((route) => route.name);
    assert.deepEqual(matched, ['core:commands']);
  });

  it('never let two routes claim the same customId', () => {
    const { client, routes } = loadBot();
    const recorded = [...client.commands.values(), ...client.slashCommands.values()].flatMap((command) =>
      flowsOf(command.recording).flatMap((flow) => flow.transitions.map((transition) => transition.customId)),
    );
    const customIds = new Set([...recorded, ...customIdLiteralsInSource()]);
    const overlaps: string[] = [];
    for (const customId of customIds) {
      for (const interaction of interactionsFor(customId)) {
        const matched = matchingRoutes(routes, interaction);
        if (matched.length > 1) overlaps.push(`${customId} (${interaction.constructor.name}): ${matched.map((route) => route.name).join(', ')}`);
      }
    }
    assert.deepEqual(overlaps, []);
  });

  it('route every button and menu that is shown enabled', () => {
    const { client, routes } = loadBot();
    const unrouted = new Set<string>();
    for (const command of [...client.commands.values(), ...client.slashCommands.values()]) {
      const flows = flowsOf(command.recording);
      for (const snapshot of recordedSnapshots(command.recording)) {
        const owningFlow = flows.find((flow) => flow.states.has(flow.start) && [...flow.states.values()].includes(snapshot)) ?? flows[0] ?? null;
        const payload = buildMessage(snapshot, SAMPLE_TOKENS, owningFlow);
        for (const customId of enabledCustomIds(payload.components ?? [])) {
          const routed = [fakeButton(client, customId), fakeStringSelect(client, customId, ['sample'])].some((interaction) => matchingRoutes(routes, interaction).length > 0);
          if (!routed) unrouted.add(`${command.recordingFile}: ${customId}`);
        }
      }
    }
    assert.deepEqual([...unrouted], []);
  });
});
