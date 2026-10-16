import fs from 'node:fs';
import path from 'node:path';
import {
  InvalidDataError,
  isRecord,
  parseJsonText,
  readArray,
  readNumber,
  readObject,
  readOptionalBoolean,
  readString,
  type JsonObject,
} from './json';

export const PROJECT_ROOT = path.join(__dirname, '..', '..');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'config.json');
const DEFAULT_DATABASE_NAME = 'bot';

export const MESSAGE_KEYS = ['serverOnly', 'ownerOnly', 'missingPermission', 'joinVoice', 'cooldown', 'error', 'noAnswer', 'notRecorded'] as const;
export type MessageKey = (typeof MESSAGE_KEYS)[number];

export type Range = readonly [low: number, high: number];

export interface Config {
  prefix: string;
  botName: string;
  slug: string;
  color: number;
  economy: { currency: string; daily: number; work: Range };
  levels: { enabled: boolean; announce: boolean; xpPerMessage: Range; cooldownSeconds: number };
  messages: Readonly<Record<MessageKey, string>>;
  root: string;
  token: string;
  ownerId: string;
  mongoUri: string;
  mongoDb: string;
}

function readRange(source: JsonObject, key: string, where: string): Range {
  const values = readArray(source, key, where);
  const [low, high] = values;
  if (values.length !== 2 || typeof low !== 'number' || typeof high !== 'number') throw new InvalidDataError(`${where}.${key}`, 'a [low, high] pair');
  return [low, high];
}

function readMessages(source: JsonObject, where: string): Record<MessageKey, string> {
  const messages = readObject(source, 'messages', where);
  const read = (key: MessageKey): string => readString(messages, key, `${where}.messages`);
  return {
    serverOnly: read('serverOnly'),
    ownerOnly: read('ownerOnly'),
    missingPermission: read('missingPermission'),
    joinVoice: read('joinVoice'),
    cooldown: read('cooldown'),
    error: read('error'),
    noAnswer: read('noAnswer'),
    notRecorded: read('notRecorded'),
  };
}

export function parseConfig(fileContents: JsonObject, env: NodeJS.ProcessEnv): Config {
  const where = 'config.json';
  const economy = readObject(fileContents, 'economy', where);
  const levels = readObject(fileContents, 'levels', where);
  const slug = readString(fileContents, 'slug', where);
  const fileOwnerId = fileContents.ownerId;
  return {
    prefix: env.PREFIX || readString(fileContents, 'prefix', where),
    botName: readString(fileContents, 'botName', where),
    slug,
    color: readNumber(fileContents, 'color', where),
    economy: {
      currency: readString(economy, 'currency', `${where}.economy`),
      daily: readNumber(economy, 'daily', `${where}.economy`),
      work: readRange(economy, 'work', `${where}.economy`),
    },
    levels: {
      enabled: readOptionalBoolean(levels, 'enabled', `${where}.levels`) ?? false,
      announce: readOptionalBoolean(levels, 'announce', `${where}.levels`) ?? false,
      xpPerMessage: readRange(levels, 'xpPerMessage', `${where}.levels`),
      cooldownSeconds: readNumber(levels, 'cooldownSeconds', `${where}.levels`),
    },
    messages: readMessages(fileContents, where),
    root: PROJECT_ROOT,
    token: env.DISCORD_TOKEN || '',
    ownerId: env.OWNER_ID || (typeof fileOwnerId === 'string' ? fileOwnerId : ''),
    mongoUri: env.MONGODB_URI || '',
    mongoDb: env.MONGODB_DB || slug || DEFAULT_DATABASE_NAME,
  };
}

function loadConfig(): Config {
  const parsed = parseJsonText(fs.readFileSync(CONFIG_FILE, 'utf8'), 'config.json');
  if (!isRecord(parsed)) throw new InvalidDataError('config.json', 'an object');
  return parseConfig(parsed, process.env);
}

const config: Config = loadConfig();

export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => values[name] ?? placeholder);
}

export default config;
