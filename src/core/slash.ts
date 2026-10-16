import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from 'discord.js';
import type {
  APIApplicationCommandBasicOption,
  APIApplicationCommandOptionChoice,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';
import type { CommandInteraction } from './context';
import type { SlashChoice, SlashCommand, SlashOption } from './types';

export const DISCORD_DESCRIPTION_LIMIT = 100;
export const DISCORD_CHOICE_NAME_LIMIT = 100;
const PATH_SEPARATOR = ' ';
const SUBCOMMAND_GROUP_DEPTH = 3;

interface Reach {
  integration_types: ApplicationIntegrationType[];
  contexts: InteractionContextType[];
}

const SERVER_ONLY: Reach = { integration_types: [ApplicationIntegrationType.GuildInstall], contexts: [InteractionContextType.Guild] };
const SERVERS_AND_DIRECT_MESSAGES: Reach = {
  integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
  contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
};

const reachOf = (command: SlashCommand): Reach => (command.dm ? SERVERS_AND_DIRECT_MESSAGES : SERVER_ONLY);

const describe = (description: string | undefined, fallback: string): string => (description || fallback).slice(0, DISCORD_DESCRIPTION_LIMIT);

function stringChoices(choices: readonly SlashChoice[] | undefined): APIApplicationCommandOptionChoice<string>[] | undefined {
  if (!choices?.length) return undefined;
  return choices.map((choice) => ({ name: String(choice.name).slice(0, DISCORD_CHOICE_NAME_LIMIT), value: String(choice.value) }));
}

function numberChoices(choices: readonly SlashChoice[] | undefined): APIApplicationCommandOptionChoice<number>[] | undefined {
  if (!choices?.length) return undefined;
  return choices.map((choice) => ({ name: String(choice.name).slice(0, DISCORD_CHOICE_NAME_LIMIT), value: Number(choice.value) }));
}

function numericBounds(option: SlashOption): { min_value?: number; max_value?: number } {
  const bounds: { min_value?: number; max_value?: number } = {};
  if (option.min_value !== undefined && option.min_value !== null) bounds.min_value = option.min_value;
  if (option.max_value !== undefined && option.max_value !== null) bounds.max_value = option.max_value;
  return bounds;
}

export function optionDefinition(option: SlashOption): APIApplicationCommandBasicOption {
  const base = { name: option.name, description: describe(option.description, option.name), required: Boolean(option.required) };
  switch (option.type) {
    case ApplicationCommandOptionType.String: {
      const choices = stringChoices(option.choices);
      return choices ? { ...base, type: option.type, choices } : { ...base, type: option.type };
    }
    case ApplicationCommandOptionType.Integer: {
      const choices = numberChoices(option.choices);
      return choices ? { ...base, type: option.type, choices, ...numericBounds(option) } : { ...base, type: option.type, ...numericBounds(option) };
    }
    case ApplicationCommandOptionType.Number: {
      const choices = numberChoices(option.choices);
      return choices ? { ...base, type: option.type, choices, ...numericBounds(option) } : { ...base, type: option.type, ...numericBounds(option) };
    }
    case ApplicationCommandOptionType.Boolean:
    case ApplicationCommandOptionType.User:
    case ApplicationCommandOptionType.Channel:
    case ApplicationCommandOptionType.Role:
    case ApplicationCommandOptionType.Mentionable:
    case ApplicationCommandOptionType.Attachment:
      return { ...base, type: option.type };
    case ApplicationCommandOptionType.Subcommand:
    case ApplicationCommandOptionType.SubcommandGroup:
      throw new Error(`Option "${option.name}" cannot be a subcommand: subcommands come from the command path`);
  }
}

type ChatInputDefinition = RESTPostAPIChatInputApplicationCommandsJSONBody & Reach;
type ContextMenuDefinition = RESTPostAPIContextMenuApplicationCommandsJSONBody & Reach;

export function contextMenuDefinitions(commands: readonly SlashCommand[]): ContextMenuDefinition[] {
  return commands.map((command) => ({
    name: command.path,
    type: command.menuType === 'user' ? ApplicationCommandType.User : ApplicationCommandType.Message,
    ...reachOf(command),
  }));
}

interface ParentDefinition extends Reach {
  name: string;
  description: string;
  options: (APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption)[];
}

type Definition = { kind: 'command'; body: ChatInputDefinition } | { kind: 'parent'; body: ParentDefinition };

function claimName(definitions: Map<string, Definition>, name: string, kind: Definition['kind']): void {
  const existing = definitions.get(name);
  if (existing && existing.kind !== kind) throw new Error(`Slash command "${name}" is both a command and a parent of subcommands`);
  if (existing && kind === 'command') throw new Error(`Slash command "${name}" is defined twice`);
}

function parentFor(definitions: Map<string, Definition>, name: string): ParentDefinition {
  claimName(definitions, name, 'parent');
  const existing = definitions.get(name);
  if (existing?.kind === 'parent') return existing.body;
  const created: ParentDefinition = { name, description: name, options: [], ...SERVERS_AND_DIRECT_MESSAGES };
  definitions.set(name, { kind: 'parent', body: created });
  return created;
}

function groupFor(parent: ParentDefinition, name: string): APIApplicationCommandSubcommandGroupOption {
  const existing = parent.options.find(
    (option): option is APIApplicationCommandSubcommandGroupOption => option.type === ApplicationCommandOptionType.SubcommandGroup && option.name === name,
  );
  if (existing) return existing;
  const created: APIApplicationCommandSubcommandGroupOption = { type: ApplicationCommandOptionType.SubcommandGroup, name, description: name, options: [] };
  parent.options.push(created);
  return created;
}

export function slashDefinitions(commands: readonly SlashCommand[]): (ChatInputDefinition | ParentDefinition)[] {
  const definitions = new Map<string, Definition>();
  for (const command of commands) {
    const parts = command.path.split(PATH_SEPARATOR);
    const rootName = parts[0] ?? command.path;
    const leafName = parts[parts.length - 1] ?? command.path;
    const description = describe(command.description, command.path);
    const leafOptions = command.options.map(optionDefinition);
    if (parts.length === 1) {
      claimName(definitions, rootName, 'command');
      definitions.set(rootName, { kind: 'command', body: { name: rootName, description, options: leafOptions, ...reachOf(command) } });
      continue;
    }
    const root = parentFor(definitions, rootName);
    if (!command.dm) Object.assign(root, SERVER_ONLY);
    const subcommand: APIApplicationCommandSubcommandOption = { type: ApplicationCommandOptionType.Subcommand, name: leafName, description, options: leafOptions };
    const groupName = parts.length === SUBCOMMAND_GROUP_DEPTH ? parts[1] : undefined;
    if (groupName === undefined) root.options.push(subcommand);
    else {
      const group = groupFor(root, groupName);
      group.options = [...(group.options ?? []), subcommand];
    }
  }
  return [...definitions.values()].map((definition) => definition.body);
}

export function definitions(commands: readonly SlashCommand[]): RESTPostAPIApplicationCommandsJSONBody[] {
  const chatInput = commands.filter((command) => command.menuType === 'slash');
  const menus = commands.filter((command) => command.menuType === 'user' || command.menuType === 'message');
  return [...slashDefinitions(chatInput), ...contextMenuDefinitions(menus)];
}

export function slashPath(interaction: CommandInteraction): string {
  if (!interaction.isChatInputCommand()) return interaction.commandName;
  return [interaction.commandName, interaction.options.getSubcommandGroup(false), interaction.options.getSubcommand(false)].filter(Boolean).join(PATH_SEPARATOR);
}
