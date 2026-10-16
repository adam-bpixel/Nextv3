import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import type { APIApplicationCommandOption, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import { definitions } from '../src/core/slash';
import { isLogicName } from '../src/features/logic';
import { flowsOf } from '../src/features/recordings/recording.model';
import { loadBot } from './support/project';

const EXPECTED_PREFIX_COMMANDS = 222;
const EXPECTED_SLASH_COMMANDS = 32;
const CHAT_INPUT_NAME = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
const MAX_DESCRIPTION = 100;
const MAX_OPTIONS = 25;
const MAX_CHOICES = 25;
const MAX_CHOICE_NAME = 100;
const MAX_CHOICE_STRING_VALUE = 100;
const MAX_GLOBAL_CHAT_INPUT_COMMANDS = 100;
const MAX_CONTEXT_MENUS_PER_TYPE = 5;
const MAX_COMMAND_CHARACTERS = 4000;

function isSubcommandLike(option: APIApplicationCommandOption): boolean {
  return option.type === ApplicationCommandOptionType.Subcommand || option.type === ApplicationCommandOptionType.SubcommandGroup;
}

function childOptions(option: APIApplicationCommandOption): APIApplicationCommandOption[] {
  if (option.type === ApplicationCommandOptionType.Subcommand) return option.options ?? [];
  if (option.type === ApplicationCommandOptionType.SubcommandGroup) return option.options ?? [];
  return [];
}

function characterCount(options: readonly APIApplicationCommandOption[]): number {
  return options.reduce((total, option) => {
    const choices = 'choices' in option ? option.choices.reduce((sum, choice) => sum + choice.name.length + String(choice.value).length, 0) : 0;
    return total + option.name.length + option.description.length + choices + characterCount(childOptions(option));
  }, 0);
}

function checkOptionLevel(where: string, options: readonly APIApplicationCommandOption[], problems: string[]): void {
  if (options.length > MAX_OPTIONS) problems.push(`${where}: ${options.length} options (max ${MAX_OPTIONS})`);
  let seenOptional = false;
  for (const option of options) {
    const at = `${where} > ${option.name}`;
    if (!CHAT_INPUT_NAME.test(option.name) || option.name !== option.name.toLowerCase()) problems.push(`${at}: invalid name`);
    if (!option.description || option.description.length > MAX_DESCRIPTION) problems.push(`${at}: description must be 1-${MAX_DESCRIPTION} characters`);
    if (isSubcommandLike(option)) {
      checkOptionLevel(at, childOptions(option), problems);
      continue;
    }
    const required = 'required' in option && option.required === true;
    if (required && seenOptional) problems.push(`${at}: required option after an optional one`);
    if (!required) seenOptional = true;
    if ('choices' in option) {
      if (option.choices.length > MAX_CHOICES) problems.push(`${at}: ${option.choices.length} choices (max ${MAX_CHOICES})`);
      for (const choice of option.choices) {
        if (!choice.name || choice.name.length > MAX_CHOICE_NAME) problems.push(`${at}: choice name "${choice.name}" too long`);
        if (typeof choice.value === 'string' && choice.value.length > MAX_CHOICE_STRING_VALUE) problems.push(`${at}: choice value too long`);
      }
    }
  }
}

function leafPaths(definition: RESTPostAPIApplicationCommandsJSONBody): string[] {
  if (definition.type !== undefined && definition.type !== ApplicationCommandType.ChatInput) return [definition.name];
  const options = definition.options ?? [];
  if (!options.some(isSubcommandLike)) return [definition.name];
  return options.flatMap((option) => {
    if (option.type === ApplicationCommandOptionType.Subcommand) return [`${definition.name} ${option.name}`];
    return childOptions(option).map((sub) => `${definition.name} ${option.name} ${sub.name}`);
  });
}

describe('commands', () => {
  it('load without duplicate names or aliases', () => {
    const { client } = loadBot();
    assert.equal(client.commands.size, EXPECTED_PREFIX_COMMANDS);
    assert.equal(client.slashCommands.size, EXPECTED_SLASH_COMMANDS);
    const names = [...client.commands.keys(), ...client.aliases.keys()];
    assert.equal(new Set(names).size, names.length);
  });

  it('use lowercase prefix names because user input is lowercased before lookup', () => {
    const { client } = loadBot();
    const unreachable = [...client.commands.values()].flatMap((command) => [command.name, ...command.aliases]).filter((name) => name !== name.toLowerCase());
    assert.deepEqual(unreachable, []);
  });

  it('point every built-in logic name at an existing handler', () => {
    const { client } = loadBot();
    const all = [...client.commands.values(), ...client.slashCommands.values()];
    const missing = all.filter((command) => command.logic !== null && !isLogicName(command.logic));
    assert.deepEqual(missing, []);
  });

  it('give every slash command something to answer with', () => {
    const { client } = loadBot();
    const silent = [...client.slashCommands.values()].filter(
      (command) => !command.execute && command.logic === null && command.ai === null && command.kind !== 'skipped' && command.recording.replies.length === 0 && command.recording.variants.length === 0,
    );
    assert.deepEqual(silent.map((command) => command.path), []);
  });

  it('register exactly the slash paths that the router can find', () => {
    const { client } = loadBot();
    const registered = definitions([...client.slashCommands.values()]).flatMap(leafPaths).sort();
    assert.deepEqual(registered, [...client.slashCommands.keys()].sort());
  });

  it('respect Discord limits for slash command payloads', () => {
    const { client } = loadBot();
    const payload = definitions([...client.slashCommands.values()]);
    const problems: string[] = [];
    const chatInput = payload.filter((definition) => definition.type === undefined || definition.type === ApplicationCommandType.ChatInput);
    if (chatInput.length > MAX_GLOBAL_CHAT_INPUT_COMMANDS) problems.push(`${chatInput.length} chat input commands`);
    for (const type of [ApplicationCommandType.User, ApplicationCommandType.Message]) {
      const count = payload.filter((definition) => definition.type === type).length;
      if (count > MAX_CONTEXT_MENUS_PER_TYPE) problems.push(`${count} context menus of type ${type}`);
    }
    for (const definition of chatInput) {
      if (!CHAT_INPUT_NAME.test(definition.name) || definition.name !== definition.name.toLowerCase()) problems.push(`${definition.name}: invalid name`);
      const description = ('description' in definition ? definition.description : undefined) ?? '';
      if (!description || description.length > MAX_DESCRIPTION) problems.push(`${definition.name}: description must be 1-${MAX_DESCRIPTION} characters`);
      const options = 'options' in definition ? definition.options ?? [] : [];
      checkOptionLevel(definition.name, options, problems);
      const total = definition.name.length + description.length + characterCount(options);
      if (total > MAX_COMMAND_CHARACTERS) problems.push(`${definition.name}: ${total} characters (max ${MAX_COMMAND_CHARACTERS})`);
    }
    assert.deepEqual(problems, []);
  });

  it('only reference recorded states that exist', () => {
    const { client } = loadBot();
    const problems: string[] = [];
    for (const command of [...client.commands.values(), ...client.slashCommands.values()]) {
      for (const flow of flowsOf(command.recording)) {
        if (!flow.states.has(flow.start)) problems.push(`${command.recordingFile} ${flow.id}: missing start state ${flow.start}`);
        for (const transition of flow.transitions) {
          if (transition.kind === 'update' && transition.to !== null && !flow.states.has(transition.to)) {
            problems.push(`${command.recordingFile} ${flow.id}: missing state ${transition.to}`);
          }
        }
      }
    }
    assert.deepEqual(problems, []);
  });
});
