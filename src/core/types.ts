import type { ApplicationCommandOptionType, BaseInteraction, ClientEvents } from 'discord.js';
import type { Ctx } from './context';
import type { PermissionName } from './permissions';
import type { LogicName } from '../features/logic';
import type { Recording } from '../features/recordings/recording.model';

export const COMMAND_KINDS = ['ok', 'usage', 'permission', 'silent', 'skipped'] as const;
export type CommandKind = (typeof COMMAND_KINDS)[number];

export const MENU_TYPES = ['slash', 'user', 'message'] as const;
export type MenuType = (typeof MENU_TYPES)[number];

export type CommandOutcome = 'completed' | 'skipped';
export type CommandHandler = (ctx: Ctx) => Promise<CommandOutcome>;
export type CustomExecute = (ctx: Ctx) => Promise<unknown>;

export interface SlashChoice {
  name: string;
  value: string | number;
}

export interface SlashOption {
  name: string;
  description?: string;
  type: ApplicationCommandOptionType;
  required?: boolean;
  choices?: SlashChoice[];
  min_value?: number | null;
  max_value?: number | null;
}

interface CommandBehavior {
  logic: LogicName | null;
  ai: string | null;
  permissions: PermissionName[];
  ownerOnly: boolean;
  cooldown: number;
  voice: boolean;
  dm: boolean;
  kind: CommandKind;
  recordingFile: string;
  execute?: CustomExecute;
}

export interface PrefixCommand extends CommandBehavior {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  category: string;
}

export interface SlashCommand extends CommandBehavior {
  path: string;
  menuType: MenuType;
  description: string;
  options: SlashOption[];
}

export type Command = PrefixCommand | SlashCommand;

export type Loaded<T extends Command> = T & { readonly recording: Recording };
export type LoadedPrefixCommand = Loaded<PrefixCommand>;
export type LoadedSlashCommand = Loaded<SlashCommand>;
export type LoadedCommand = LoadedPrefixCommand | LoadedSlashCommand;

export function commandLabel(command: Command): string {
  return 'path' in command ? command.path : command.name;
}

export type BotEventName = keyof ClientEvents;

export interface BotEvent<K extends BotEventName = BotEventName> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void>;
}

export function defineEvent<K extends BotEventName>(event: BotEvent<K>): BotEvent<K> {
  return event;
}

export interface InteractionRoute<T extends BaseInteraction = BaseInteraction> {
  name: string;
  match(interaction: BaseInteraction): interaction is T;
  handle(interaction: T): Promise<unknown>;
}

export function defineRoute<T extends BaseInteraction>(route: InteractionRoute<T>): InteractionRoute {
  return {
    name: route.name,
    match: (interaction): interaction is BaseInteraction => route.match(interaction),
    handle: async (interaction) => (route.match(interaction) ? route.handle(interaction) : undefined),
  };
}
