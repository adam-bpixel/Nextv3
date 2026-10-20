import path from 'node:path';
import { ComponentType, MessageFlags } from 'discord.js';
import type { APIModalInteractionResponseCallbackData, AttachmentPayload } from 'discord.js';
import config from '../../core/config';
import { InvalidDataError, isRecord, readArray, readString, type JsonObject, type JsonValue } from '../../core/json';
import type { Ctx, ReplyPayload } from '../../core/context';
import { toEmbeds, toTextInput, toTopLevelComponents } from './components.schema';
import type { Flow, Snapshot } from './recording.model';

const TOKEN_NAMES = ['mention', 'username', 'displayName', 'userId', 'avatar', 'guild', 'botName'] as const;
type TokenName = (typeof TOKEN_NAMES)[number];
export type Tokens = Record<TokenName, string>;

const TOKEN_PATTERN = new RegExp(`\\{\\{(${TOKEN_NAMES.join('|')})\\}\\}`, 'g');
const UNTOUCHED_KEY = 'custom_id';
const AVATAR_SIZE = 1024;
const GUILD_FALLBACK_NAME = 'this server';
const MODAL_FIELD_KEYS = ['type', 'custom_id', 'style', 'label', 'placeholder', 'min_length', 'max_length', 'required'] as const;

export interface EditPayload extends ReplyPayload {
  attachments?: [];
}

function isTokenName(name: string): name is TokenName {
  return TOKEN_NAMES.some((token) => token === name);
}

export function tokensOf(ctx: Ctx): Tokens {
  const { user } = ctx;
  return {
    mention: `<@${user.id}>`,
    username: user.username,
    displayName: ctx.member?.displayName || user.displayName || user.username,
    userId: user.id,
    avatar: user.displayAvatarURL({ extension: 'png', size: AVATAR_SIZE }),
    guild: ctx.guild ? ctx.guild.name : GUILD_FALLBACK_NAME,
    botName: ctx.client.user?.username ?? config.botName,
  };
}

export function fill(value: JsonValue, tokens: Tokens): JsonValue {
  if (typeof value === 'string') return value.replace(TOKEN_PATTERN, (placeholder, name: string) => (isTokenName(name) ? tokens[name] : placeholder));
  if (Array.isArray(value)) return value.map((item) => fill(item, tokens));
  if (isRecord(value)) {
    const filled: JsonObject = {};
    for (const [key, item] of Object.entries(value)) filled[key] = key === UNTOUCHED_KEY ? item : fill(item, tokens);
    return filled;
  }
  return value;
}

function disableUnrecorded(value: JsonValue, playable: ReadonlySet<string> | null): JsonValue {
  if (Array.isArray(value)) return value.map((item) => disableUnrecorded(item, playable));
  if (!isRecord(value)) return value;
  const result: JsonObject = {};
  for (const [key, item] of Object.entries(value)) result[key] = disableUnrecorded(item, playable);
  const customId = result.custom_id;
  if (typeof customId === 'string' && customId && !playable?.has(customId)) result.disabled = true;
  return result;
}

function attachmentsOf(snapshot: Snapshot): AttachmentPayload[] {
  return snapshot.attachments.map((attachment) => ({
    attachment: attachment.local ? path.join(config.root, attachment.local) : attachment.url,
    name: attachment.filename,
  }));
}

function buildPayloadFrom(snapshot: Snapshot, tokens: Tokens, flow: Flow | null, edit: boolean): EditPayload {
  const where = 'snapshot';
  const payload: EditPayload = {};
  const filledContent = fill(snapshot.content, tokens);
  const content = typeof filledContent === 'string' ? filledContent : '';
  const embedsJson = fill(snapshot.embeds, tokens);
  const playable = flow ? new Set(flow.transitions.map((transition) => transition.customId)) : null;
  const componentsJson = disableUnrecorded(fill(snapshot.components, tokens), playable);
  const embeds = toEmbeds(Array.isArray(embedsJson) ? embedsJson : [], `${where}.embeds`);
  const components = toTopLevelComponents(Array.isArray(componentsJson) ? componentsJson : [], `${where}.components`);

  if (snapshot.v2) {
    payload.flags = MessageFlags.IsComponentsV2;
    payload.components = components;
  } else {
    if (content || edit) payload.content = content;
    if (embeds.length || edit) payload.embeds = embeds;
    if (components.length || edit) payload.components = components;
  }
  const files = attachmentsOf(snapshot);
  if (files.length) payload.files = files;
  else if (edit) payload.attachments = [];
  return payload;
}

export function buildMessage(snapshot: Snapshot, tokens: Tokens, flow: Flow | null = null): ReplyPayload {
  return buildPayloadFrom(snapshot, tokens, flow, false);
}

export function buildEdit(snapshot: Snapshot, tokens: Tokens, flow: Flow): EditPayload {
  return buildPayloadFrom(snapshot, tokens, flow, true);
}

export function isEmpty(payload: ReplyPayload): boolean {
  return !payload.content && !payload.embeds?.length && !payload.components?.length && !payload.files?.length;
}

function withoutEmptyValues(source: JsonObject): JsonObject {
  const kept: JsonObject = {};
  for (const key of MODAL_FIELD_KEYS) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') kept[key] = value;
  }
  return kept;
}

export function buildModal(modal: JsonObject, tokens: Tokens): APIModalInteractionResponseCallbackData {
  const where = 'modal';
  const filled = fill(modal, tokens);
  if (!isRecord(filled)) throw new InvalidDataError(where, 'an object');
  return {
    title: readString(filled, 'title', where),
    custom_id: readString(filled, 'custom_id', where),
    components: readArray(filled, 'components', where).map((row, rowIndex) => {
      const rowWhere = `${where}.components[${rowIndex}]`;
      if (!isRecord(row)) throw new InvalidDataError(rowWhere, 'an object');
      return {
        type: ComponentType.ActionRow,
        components: readArray(row, 'components', rowWhere).map((field, fieldIndex) => {
          const fieldWhere = `${rowWhere}.components[${fieldIndex}]`;
          if (!isRecord(field)) throw new InvalidDataError(fieldWhere, 'an object');
          return toTextInput(withoutEmptyValues(field), fieldWhere);
        }),
      };
    }),
  };
}
