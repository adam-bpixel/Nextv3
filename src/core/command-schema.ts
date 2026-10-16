import { ApplicationCommandOptionType } from 'discord.js';
import { isLogicName } from '../features/logic';
import { isRecord } from './json';
import { isPermissionName, type PermissionName } from './permissions';
import {
  COMMAND_KINDS,
  MENU_TYPES,
  type CommandKind,
  type CustomExecute,
  type MenuType,
  type PrefixCommand,
  type SlashChoice,
  type SlashCommand,
  type SlashOption,
} from './types';
import type { LogicName } from '../features/logic';

export class InvalidCommandError extends Error {
  constructor(file: string, field: string, expected: string) {
    super(`${file}: "${field}" must be ${expected}`);
    this.name = 'InvalidCommandError';
  }
}

type Fields = Record<string, unknown>;

function field<T>(source: Fields, key: string, file: string, expected: string, guard: (value: unknown) => value is T): T {
  const value = source[key];
  if (!guard(value)) throw new InvalidCommandError(file, key, expected);
  return value;
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isNonNegativeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isOptionalNullableNumber = (value: unknown): value is number | null | undefined => value === undefined || value === null || typeof value === 'number';
const isOptionalString = (value: unknown): value is string | undefined => value === undefined || typeof value === 'string';
const isOptionalBoolean = (value: unknown): value is boolean | undefined => value === undefined || typeof value === 'boolean';

const isCommandKind = (value: unknown): value is CommandKind => COMMAND_KINDS.some((kind) => kind === value);
const isMenuType = (value: unknown): value is MenuType => MENU_TYPES.some((type) => type === value);
const isPermissionList = (value: unknown): value is PermissionName[] => isStringArray(value) && value.every(isPermissionName);
const isLogic = (value: unknown): value is LogicName | null => value === null || (typeof value === 'string' && isLogicName(value));
const OPTION_TYPES: readonly unknown[] = Object.values(ApplicationCommandOptionType).filter((value) => typeof value === 'number');
const isOptionType = (value: unknown): value is ApplicationCommandOptionType => OPTION_TYPES.includes(value);

function toCustomExecute(source: Fields, file: string): CustomExecute | undefined {
  const execute = source.execute;
  if (execute === undefined) return undefined;
  if (typeof execute !== 'function') throw new InvalidCommandError(file, 'execute', 'a function');
  return async (ctx) => {
    const result: unknown = await Reflect.apply(execute, source, [ctx]);
    return result;
  };
}

function toChoice(value: unknown, file: string, where: string): SlashChoice {
  if (!isRecord(value)) throw new InvalidCommandError(file, where, 'an object');
  const name = field(value, 'name', file, 'a string', isString);
  const choiceValue = value.value;
  if (typeof choiceValue !== 'string' && typeof choiceValue !== 'number') throw new InvalidCommandError(file, `${where}.value`, 'a string or number');
  return { name, value: choiceValue };
}

function toOption(value: unknown, file: string, index: number): SlashOption {
  const where = `options[${index}]`;
  if (!isRecord(value)) throw new InvalidCommandError(file, where, 'an object');
  const choices = value.choices;
  if (choices !== undefined && !Array.isArray(choices)) throw new InvalidCommandError(file, `${where}.choices`, 'an array');
  const option: SlashOption = {
    name: field(value, 'name', file, 'a string', isString),
    type: field(value, 'type', file, 'an application command option type', isOptionType),
  };
  const description = field(value, 'description', file, 'a string', isOptionalString);
  const required = field(value, 'required', file, 'a boolean', isOptionalBoolean);
  const minValue = field(value, 'min_value', file, 'a number or null', isOptionalNullableNumber);
  const maxValue = field(value, 'max_value', file, 'a number or null', isOptionalNullableNumber);
  if (description !== undefined) option.description = description;
  if (required !== undefined) option.required = required;
  if (choices !== undefined) option.choices = choices.map((choice: unknown, choiceIndex) => toChoice(choice, file, `${where}.choices[${choiceIndex}]`));
  if (minValue !== undefined) option.min_value = minValue;
  if (maxValue !== undefined) option.max_value = maxValue;
  return option;
}

function behaviorOf(source: Fields, file: string) {
  const behavior = {
    logic: field(source, 'logic', file, 'null or the name of a built-in logic', isLogic),
    ai: field(source, 'ai', file, 'null or a string', isNullableString),
    permissions: field(source, 'permissions', file, 'a list of permission names like "ban_members"', isPermissionList),
    ownerOnly: field(source, 'ownerOnly', file, 'a boolean', isBoolean),
    cooldown: field(source, 'cooldown', file, 'a number of seconds', isNonNegativeNumber),
    voice: field(source, 'voice', file, 'a boolean', isBoolean),
    dm: field(source, 'dm', file, 'a boolean', isBoolean),
    kind: field(source, 'kind', file, COMMAND_KINDS.join(' | '), isCommandKind),
    recordingFile: field(source, 'recordingFile', file, 'a string', isString),
  };
  const execute = toCustomExecute(source, file);
  return execute ? { ...behavior, execute } : behavior;
}

export function toPrefixCommand(value: unknown, file: string): PrefixCommand {
  if (!isRecord(value)) throw new InvalidCommandError(file, 'export', 'a command object');
  return {
    name: field(value, 'name', file, 'a string', isString),
    aliases: field(value, 'aliases', file, 'a list of strings', isStringArray),
    description: field(value, 'description', file, 'a string', isString),
    usage: field(value, 'usage', file, 'a string', isString),
    category: field(value, 'category', file, 'a string', isString),
    ...behaviorOf(value, file),
  };
}

export function toSlashCommand(value: unknown, file: string): SlashCommand {
  if (!isRecord(value)) throw new InvalidCommandError(file, 'export', 'a command object');
  const options = value.options ?? [];
  if (!Array.isArray(options)) throw new InvalidCommandError(file, 'options', 'an array');
  return {
    path: field(value, 'path', file, 'a string', isString),
    menuType: field(value, 'menuType', file, MENU_TYPES.join(' | '), isMenuType),
    description: field(value, 'description', file, 'a string', isString),
    options: options.map((option: unknown, index) => toOption(option, file, index)),
    ...behaviorOf(value, file),
  };
}
