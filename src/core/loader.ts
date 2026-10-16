import fs from 'node:fs';
import path from 'node:path';
import { Events, type BaseInteraction } from 'discord.js';
import config from './config';
import { isRecord, parseJsonText } from './json';
import { SOURCE_EXTENSION, defaultExport, listSourceFiles, loadModule } from './modules';
import { toPrefixCommand, toSlashCommand } from './command-schema';
import { parseRecording, type Recording } from '../features/recordings/recording.model';
import { clearFlowIndex, indexRecording, setMentionRecording } from '../features/recordings/flows.model';
import type { BotClient } from './client';
import type { BotEventName, InteractionRoute } from './types';

export const SRC_DIR = path.join(__dirname, '..');
export const PREFIX_COMMANDS_DIR = path.join(SRC_DIR, 'commands', 'prefix');
export const SLASH_COMMANDS_DIR = path.join(SRC_DIR, 'commands', 'slash');
export const EVENTS_DIR = path.join(SRC_DIR, 'events');
export const FEATURES_DIR = path.join(SRC_DIR, 'features');
export const RECORDINGS_DIR = path.join(config.root, 'data', 'recordings');
const MENTION_RECORDING_FILE = 'mention.json';
const FEATURE_ENTRY = 'index';

export class DuplicateNameError extends Error {
  constructor(kind: string, name: string, first: string, second: string) {
    super(`Duplicate ${kind} "${name}" in ${first} and ${second}`);
    this.name = 'DuplicateNameError';
  }
}

export interface LoadedEvent {
  name: BotEventName;
  once: boolean;
  file: string;
  execute(...args: unknown[]): Promise<unknown>;
}

export function readRecording(recordingFile: string): Recording {
  const file = path.join(RECORDINGS_DIR, recordingFile);
  return parseRecording(parseJsonText(fs.readFileSync(file, 'utf8'), recordingFile), recordingFile);
}

function claim(owners: Map<string, string>, kind: string, name: string, file: string): void {
  const existing = owners.get(name);
  if (existing !== undefined) throw new DuplicateNameError(kind, name, existing, file);
  owners.set(name, file);
}

export function loadCommands(client: BotClient): void {
  client.commands.clear();
  client.aliases.clear();
  client.slashCommands.clear();
  clearFlowIndex();
  const prefixOwners = new Map<string, string>();
  for (const file of listSourceFiles(PREFIX_COMMANDS_DIR)) {
    const command = toPrefixCommand(defaultExport(loadModule(file)), file);
    claim(prefixOwners, 'prefix command or alias', command.name, file);
    for (const alias of command.aliases) claim(prefixOwners, 'prefix command or alias', alias, file);
    const recording = readRecording(command.recordingFile);
    indexRecording(recording);
    client.commands.set(command.name, { ...command, recording });
    for (const alias of command.aliases) client.aliases.set(alias, command.name);
  }
  const slashOwners = new Map<string, string>();
  for (const file of listSourceFiles(SLASH_COMMANDS_DIR)) {
    const command = toSlashCommand(defaultExport(loadModule(file)), file);
    claim(slashOwners, 'slash command', command.path, file);
    const recording = readRecording(command.recordingFile);
    indexRecording(recording);
    client.slashCommands.set(command.path, { ...command, recording });
  }
  setMentionRecording(readRecording(MENTION_RECORDING_FILE));
}

const EVENT_NAMES: readonly string[] = Object.values(Events);

function isBotEventName(value: unknown): value is BotEventName {
  return typeof value === 'string' && EVENT_NAMES.includes(value);
}

function callable(owner: object, value: unknown, file: string, what: string): (...args: unknown[]) => unknown {
  if (typeof value !== 'function') throw new Error(`${file}: ${what} must be a function`);
  return (...args: unknown[]): unknown => Reflect.apply(value, owner, args);
}

export function toLoadedEvent(value: unknown, file: string): LoadedEvent {
  if (!isRecord(value)) throw new Error(`${file}: must export an event object`);
  const { name, once } = value;
  if (!isBotEventName(name)) throw new Error(`${file}: "name" must be a discord.js Events value`);
  if (once !== undefined && typeof once !== 'boolean') throw new Error(`${file}: "once" must be a boolean`);
  const execute = callable(value, value.execute, file, '"execute"');
  return { name, once: once ?? false, file, execute: async (...args) => await execute(...args) };
}

export function loadEvents(): LoadedEvent[] {
  return listSourceFiles(EVENTS_DIR).map((file) => toLoadedEvent(defaultExport(loadModule(file)), file));
}

export function attachEvents(client: BotClient, events: readonly LoadedEvent[]): void {
  for (const event of events) {
    const listener = (...args: unknown[]): void => {
      event.execute(...args).catch((error: unknown) => console.error(`Event ${event.name} (${event.file}) failed:`, error));
    };
    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);
  }
}

function toRoute(value: unknown, file: string, index: number): InteractionRoute {
  const where = `${file} routes[${index}]`;
  if (!isRecord(value)) throw new Error(`${where}: must be a route object`);
  const { name } = value;
  if (typeof name !== 'string' || !name) throw new Error(`${where}: "name" must be a non-empty string`);
  const match = callable(value, value.match, where, '"match"');
  const handle = callable(value, value.handle, where, '"handle"');
  return {
    name,
    match: (interaction): interaction is BaseInteraction => match(interaction) === true,
    handle: async (interaction) => await handle(interaction),
  };
}

export function featureEntryFiles(): string[] {
  if (!fs.existsSync(FEATURES_DIR)) return [];
  return fs
    .readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(FEATURES_DIR, entry.name, `${FEATURE_ENTRY}${SOURCE_EXTENSION}`))
    .filter((file) => fs.existsSync(file))
    .sort();
}

export function loadRoutes(): InteractionRoute[] {
  const routes: InteractionRoute[] = [];
  const owners = new Map<string, string>();
  for (const file of featureEntryFiles()) {
    const loaded = loadModule(file);
    if (!isRecord(loaded) || loaded.routes === undefined) continue;
    if (!Array.isArray(loaded.routes)) throw new Error(`${file}: "routes" must be an array`);
    loaded.routes.forEach((value: unknown, index) => {
      const route = toRoute(value, file, index);
      claim(owners, 'route', route.name, file);
      routes.push(route);
    });
  }
  return routes;
}

export function loadAll(client: BotClient): LoadedEvent[] {
  loadCommands(client);
  client.routes.splice(0, client.routes.length, ...loadRoutes());
  return loadEvents();
}
