import { ApplicationCommandOptionType, DiscordAPIError, MessageFlags } from 'discord.js';
import type {
  APIEmbed,
  APIMessageTopLevelComponent,
  AttachmentPayload,
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandInteraction,
  Guild,
  GuildMember,
  Message,
  MessageComponentInteraction,
  MessageMentionOptions,
  TextBasedChannel,
  User,
} from 'discord.js';
import config from './config';
import { permissionBit, type PermissionName } from './permissions';
import type { SlashOption } from './types';
import { cachedColor } from '../features/theme/theme.model';

export type CommandInteraction = ChatInputCommandInteraction | ContextMenuCommandInteraction;

export type CtxSource =
  | { kind: 'message'; message: Message }
  | { kind: 'command'; interaction: CommandInteraction }
  | { kind: 'component'; interaction: MessageComponentInteraction };

export interface ReplyPayload {
  content?: string;
  embeds?: APIEmbed[];
  components?: APIMessageTopLevelComponent[];
  files?: AttachmentPayload[];
  flags?: number;
  allowedMentions?: MessageMentionOptions;
}

export interface SendOptions {
  reply?: boolean;
  ping?: boolean;
}

export type NonEmptyArray<T> = readonly [T, ...T[]];

export interface Ctx {
  source: CtxSource;
  client: Client;
  prefix: string;
  args: string[];
  text: string;
  isInteraction: boolean;
  inDM: boolean;
  user: User;
  member: GuildMember | null;
  guild: Guild | null;
  channel: TextBasedChannel | null;
  createdTimestamp: number;
  send(payload: string | ReplyPayload, options?: SendOptions): Promise<Message>;
  whisper(content: string): Promise<Message>;
  embed(options?: APIEmbed): { embeds: APIEmbed[] };
  hasPermission(permission: PermissionName): boolean;
  targetUser(index?: number): Promise<User>;
  findUser(index?: number): Promise<User | null>;
  targetMember(index?: number): Promise<GuildMember | null>;
  random<T>(items: NonEmptyArray<T>): T;
  randInt(low: number, high: number): number;
}

const USER_REFERENCE = /^<@!?(\d{15,22})>$|^(\d{15,22})$/;

export function pickRandom<T>(items: NonEmptyArray<T>): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

export function randomInt(low: number, high: number): number {
  return low + Math.floor(Math.random() * (high - low + 1));
}

function toPayload(payload: string | ReplyPayload): ReplyPayload {
  return typeof payload === 'string' ? { content: payload } : payload;
}

const SEND_ATTEMPTS = 2;

const isAbortError = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError';

async function withAbortRetry<T>(attempt: () => Promise<T>): Promise<T> {
  for (let tries = 1; tries <= SEND_ATTEMPTS; tries++) {
    try {
      return await attempt();
    } catch (error) {
      if (tries === SEND_ATTEMPTS || !isAbortError(error)) throw error;
    }
  }
  throw new Error('unreachable');
}

// The invoking message can be deleted (manual delete, a purge, auto-moderation) between the
// command starting and the reply going out; Discord then rejects the reply's message_reference
// instead of just dropping it, so fall back to a plain channel message rather than losing the answer.
const isUnknownMessageReference = (error: unknown): boolean =>
  error instanceof DiscordAPIError && error.code === 50035 && error.message.includes('MESSAGE_REFERENCE_UNKNOWN_MESSAGE');

async function sendToMessage(message: Message, payload: ReplyPayload, { reply = true, ping = false }: SendOptions): Promise<Message> {
  if (reply) {
    try {
      return await message.reply({ ...payload, allowedMentions: { ...payload.allowedMentions, repliedUser: ping } });
    } catch (error) {
      if (!isUnknownMessageReference(error)) throw error;
    }
  }
  if (!message.channel.isSendable()) throw new Error(`Channel ${message.channelId} does not accept messages`);
  return message.channel.send(payload);
}

async function sendToInteraction(interaction: CommandInteraction | MessageComponentInteraction, payload: ReplyPayload): Promise<Message> {
  if (interaction.deferred && !interaction.replied && (interaction.isChatInputCommand() || interaction.isContextMenuCommand())) {
    return interaction.editReply(payload);
  }
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply(payload);
    return interaction.fetchReply();
  }
  return interaction.followUp(payload);
}

function memberOf(source: CtxSource): GuildMember | null {
  if (source.kind === 'message') return source.message.member;
  return source.interaction.inCachedGuild() ? source.interaction.member : null;
}

function messageAuthorHas(message: Message, permission: PermissionName): boolean {
  if (!message.inGuild() || !message.member) return false;
  const permissions = message.channel.permissionsFor(message.member);
  return permissions.has(permissionBit(permission));
}

function interactionUserHas(interaction: CommandInteraction | MessageComponentInteraction, permission: PermissionName): boolean {
  const permissions = interaction.memberPermissions;
  return permissions !== null && permissions.has(permissionBit(permission));
}

export function makeContext(source: CtxSource, args: string[] = [], prefix = config.prefix): Ctx {
  const isInteraction = source.kind !== 'message';
  const origin = source.kind === 'message' ? source.message : source.interaction;
  const user = source.kind === 'message' ? source.message.author : source.interaction.user;

  const findUser = async (index = 0): Promise<User | null> => {
    const match = USER_REFERENCE.exec(args[index] ?? '');
    const id = match?.[1] ?? match?.[2];
    if (id === undefined) return null;
    return origin.client.users.fetch(id).catch(() => null);
  };

  const ctx: Ctx = {
    source,
    client: origin.client,
    prefix,
    args,
    text: args.join(' '),
    isInteraction,
    inDM: !origin.guildId,
    user,
    member: memberOf(source),
    guild: origin.guild,
    channel: origin.channel,
    createdTimestamp: origin.createdTimestamp,

    send(payload, options = {}) {
      const normalized = toPayload(payload);
      return withAbortRetry(() =>
        source.kind === 'message' ? sendToMessage(source.message, normalized, options) : sendToInteraction(source.interaction, normalized),
      );
    },

    whisper(content) {
      return ctx.send(isInteraction ? { content, flags: MessageFlags.Ephemeral } : { content });
    },

    embed({ color, ...rest } = {}) {
      const guildColor = ctx.guild ? cachedColor(ctx.guild.id) : undefined;
      return { embeds: [{ color: color ?? guildColor ?? config.color, ...rest }] };
    },

    hasPermission(permission) {
      if (ctx.inDM) return true;
      if (source.kind === 'message') return messageAuthorHas(source.message, permission);
      return interactionUserHas(source.interaction, permission);
    },

    findUser,

    async targetUser(index = 0) {
      return (await findUser(index)) ?? user;
    },

    async targetMember(index = 0) {
      if (!ctx.guild) return null;
      const target = await findUser(index);
      return target ? ctx.guild.members.fetch(target.id).catch(() => null) : null;
    },

    random: pickRandom,
    randInt: randomInt,
  };
  return ctx;
}

const MENTION_FORMAT: Partial<Record<ApplicationCommandOptionType, (id: string) => string>> = {
  [ApplicationCommandOptionType.User]: (id) => `<@${id}>`,
  [ApplicationCommandOptionType.Mentionable]: (id) => `<@${id}>`,
  [ApplicationCommandOptionType.Channel]: (id) => `<#${id}>`,
  [ApplicationCommandOptionType.Role]: (id) => `<@&${id}>`,
};

export function slashArgs(interaction: CommandInteraction, options: readonly SlashOption[]): string[] {
  const args: string[] = [];
  for (const option of options) {
    const value = interaction.options.get(option.name, false)?.value;
    if (value === undefined) continue;
    const format = MENTION_FORMAT[option.type];
    if (format) args.push(format(String(value)));
    else args.push(...String(value).split(/\s+/));
  }
  if (interaction.isUserContextMenuCommand()) args.push(`<@${interaction.targetId}>`);
  return args;
}
