import { Client, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import { buildShardingStrategy } from './botDevice';
import type { InteractionRoute, LoadedPrefixCommand, LoadedSlashCommand } from './types';

const MESSAGE_CACHE_PER_CHANNEL = 50;
const MESSAGE_SWEEP_INTERVAL_SECONDS = 3600;
const MESSAGE_MAX_AGE_SECONDS = 1800;
const REST_REQUEST_TIMEOUT_MS = 30_000;

export const GATEWAY_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.MessageContent,
] as const;

export const PARTIALS_FOR_DIRECT_MESSAGES = [Partials.Channel] as const;

export class BotClient extends Client {
  readonly commands = new Collection<string, LoadedPrefixCommand>();
  readonly aliases = new Collection<string, string>();
  readonly slashCommands = new Collection<string, LoadedSlashCommand>();
  readonly routes: InteractionRoute[] = [];
  fleetId: string | null = null;

  constructor() {
    super({
      intents: [...GATEWAY_INTENTS],
      partials: [...PARTIALS_FOR_DIRECT_MESSAGES],
      makeCache: Options.cacheWithLimits({ ...Options.DefaultMakeCacheSettings, MessageManager: MESSAGE_CACHE_PER_CHANNEL }),
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: { interval: MESSAGE_SWEEP_INTERVAL_SECONDS, lifetime: MESSAGE_MAX_AGE_SECONDS },
      },
      rest: { timeout: REST_REQUEST_TIMEOUT_MS },
      ws: { buildStrategy: buildShardingStrategy },
    });
  }

  findPrefixCommand(name: string): LoadedPrefixCommand | undefined {
    return this.commands.get(name) ?? this.commands.get(this.aliases.get(name) ?? '');
  }
}

export function asBotClient(client: Client): BotClient {
  if (!(client instanceof BotClient)) throw new Error('This handler needs the BotClient created in src/index.ts');
  return client;
}
