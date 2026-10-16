import fs from 'node:fs';
import path from 'node:path';
import type { APIEmbed, User } from 'discord.js';
import db from '../../core/db';
import { SOURCE_EXTENSION, defaultExport, loadModule } from '../../core/modules';
import type { Ctx, NonEmptyArray, ReplyPayload } from '../../core/context';
import type { CommandOutcome } from '../../core/types';

const OPTIONAL_AI_SCRIPTS_DIR = path.join(__dirname, 'scripts');
const AI_COLLECTION_PREFIX = 'ai_';
const AVATAR_SIZE = 1024;

export interface AiUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  mention: string;
}

export interface AiApi {
  args: string[];
  text: string;
  inDM: boolean;
  user: AiUser;
  guild: { id: string; name: string; memberCount: number } | null;
  reply(payload: string | ReplyPayload): Promise<void>;
  embed(options: APIEmbed): { embeds: APIEmbed[] };
  db: { get(collection: string, key: string): Promise<unknown>; set(collection: string, key: string, value: unknown): Promise<void> };
  random<T>(items: NonEmptyArray<T>): T;
  randInt(low: number, high: number): number;
  targetUser(index?: number): Promise<AiUser>;
}

type AiRun = (api: AiApi) => Promise<unknown>;

const loadedScripts = new Map<string, AiRun | null>();

function toAiUser(user: User): AiUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.displayAvatarURL({ extension: 'png', size: AVATAR_SIZE }),
    mention: `<@${user.id}>`,
  };
}

function aiApi(ctx: Ctx): AiApi {
  return {
    args: [...ctx.args],
    text: ctx.text,
    inDM: ctx.inDM,
    user: toAiUser(ctx.user),
    guild: ctx.guild ? { id: ctx.guild.id, name: ctx.guild.name, memberCount: ctx.guild.memberCount } : null,
    reply: async (payload) => {
      await ctx.send(payload);
    },
    embed: (options) => ctx.embed(options),
    db: {
      get: (collection, key) => db.get(`${AI_COLLECTION_PREFIX}${collection}`, key),
      set: (collection, key, value) => db.set(`${AI_COLLECTION_PREFIX}${collection}`, key, value),
    },
    random: (items) => ctx.random(items),
    randInt: (low, high) => ctx.randInt(low, high),
    targetUser: async (index = 0) => toAiUser(await ctx.targetUser(index)),
  };
}

function exportedFunction(loaded: unknown): ((...args: unknown[]) => unknown) | null {
  const candidate = defaultExport(loaded);
  if (typeof candidate !== 'function') return null;
  return (...args: unknown[]): unknown => Reflect.apply(candidate, undefined, args);
}

function loadScript(name: string): AiRun | null {
  const cached = loadedScripts.get(name);
  if (cached !== undefined) return cached;
  const file = path.join(OPTIONAL_AI_SCRIPTS_DIR, `${name}${SOURCE_EXTENSION}`);
  let script: AiRun | null = null;
  if (fs.existsSync(file)) {
    try {
      const run = exportedFunction(loadModule(file));
      if (run) script = async (api) => await run(api);
    } catch (error) {
      console.error(`AI logic ${name} could not be loaded, using the recorded answer:`, error instanceof Error ? error.message : error);
    }
  }
  loadedScripts.set(name, script);
  return script;
}

export async function runAiLogic(name: string, ctx: Ctx): Promise<CommandOutcome | null> {
  const script = loadScript(name);
  if (!script) return null;
  try {
    const result = await script(aiApi(ctx));
    return result === false ? 'skipped' : 'completed';
  } catch (error) {
    console.error(`AI logic ${name} failed, using the recorded answer:`, error instanceof Error ? error.message : error);
    return null;
  }
}
