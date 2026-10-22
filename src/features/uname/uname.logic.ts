import { isOwner } from '../../core/config';
import { discordTimestamp } from '../../core/format';
import db from '../../core/db';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply, themedReplyFor } from '../../core/usage-replies';
import { isConfigured, selfbotApiPost } from '../checker/selfbot';
import { isPremiumUser } from '../premium/premium.model';

const DELIVERED_COLLECTION = 'unameDelivered';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LENGTHS = [4, 5] as const;
const TAKEN_COLLECTION = 'unameTaken';
const POOL_COLLECTION = 'unamePool';
const POOL_LIMIT = 100;
const SCAN_INTERVAL_MS = 45_000;
const TAKEN_TTL_MS = 12 * 60 * 60 * 1000;
const BATCH_SIZE = 4;
const MAX_ROUNDS = 10;
const ROUND_DELAY_MS = 500;
const RATE_LIMIT_DELAY_MS = 2000;

interface PomeloAttempt {
  taken?: boolean;
}

function randomHandle(): string {
  const length = LENGTHS[Math.floor(Math.random() * LENGTHS.length)] ?? 4;
  let handle = '';
  for (let index = 0; index < length; index++) handle += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return handle;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isKnownUnavailable(handle: string): Promise<boolean> {
  if (await db.get(DELIVERED_COLLECTION, handle)) return true;
  const taken = await db.get(TAKEN_COLLECTION, handle);
  return typeof taken === 'number' && Date.now() - taken < TAKEN_TTL_MS;
}

type HandleCheck = 'free' | 'taken' | 'failed';

async function checkHandle(handle: string): Promise<HandleCheck> {
  try {
    const result = await selfbotApiPost<PomeloAttempt>('/users/@me/pomelo-attempt', { username: handle });
    if (result.taken === false) return 'free';
    await db.set(TAKEN_COLLECTION, handle, Date.now());
    return 'taken';
  } catch (error) {
    console.error('[uname]', error instanceof Error ? error.message : String(error));
    return 'failed';
  }
}

async function findAvailableHandle(): Promise<string | null> {
  const tried = new Set<string>();
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const candidates: string[] = [];
    while (candidates.length < BATCH_SIZE && tried.size < MAX_ROUNDS * BATCH_SIZE * 4) {
      const handle = randomHandle();
      if (tried.has(handle)) continue;
      tried.add(handle);
      candidates.push(handle);
    }
    const fresh = (await Promise.all(candidates.map(async (handle) => ((await isKnownUnavailable(handle)) ? null : handle)))).filter(
      (handle): handle is string => handle !== null,
    );
    const results = await Promise.all(fresh.map(async (handle) => ({ handle, state: await checkHandle(handle) })));
    const found = results.find((entry) => entry.state === 'free');
    if (found) return found.handle;
    await sleep(results.some((entry) => entry.state === 'failed') ? RATE_LIMIT_DELAY_MS : ROUND_DELAY_MS);
  }
  return null;
}

interface FoundHandle {
  handle: string;
  at: number;
}

async function takeFromPool(): Promise<FoundHandle | null> {
  const pool = await db.all(POOL_COLLECTION);
  for (const entry of pool) {
    const state = await checkHandle(entry.key);
    if (state === 'failed') continue;
    await db.delete(POOL_COLLECTION, entry.key);
    if (state === 'free') {
      const at = typeof entry.value === 'object' && entry.value !== null && 'at' in entry.value && typeof entry.value.at === 'number' ? entry.value.at : Date.now();
      return { handle: entry.key, at };
    }
  }
  return null;
}

let scanning = false;

async function scanOnce(): Promise<void> {
  if (scanning || !isConfigured()) return;
  scanning = true;
  try {
    const pool = await db.all(POOL_COLLECTION);
    if (pool.length >= POOL_LIMIT) return;
    const pooled = new Set(pool.map((entry) => entry.key));
    const handle = randomHandle();
    if (pooled.has(handle) || (await isKnownUnavailable(handle))) return;
    if ((await checkHandle(handle)) === 'free') await db.set(POOL_COLLECTION, handle, { at: Date.now() });
  } finally {
    scanning = false;
  }
}

export function startUnameScanner(): void {
  setInterval(() => void scanOnce().catch((error: unknown) => console.error('[uname]', error instanceof Error ? error.message : String(error))), SCAN_INTERVAL_MS);
}

export const unameLogic = {
  async uname(ctx) {
    if (!isOwner(ctx.user.id) && !(await isPremiumUser(ctx.user.id))) {
      await ctx.send(errorReply(ctx, 'Handle Hunter is available to **Premium** subscribers only.'));
      return 'skipped';
    }
    if (!isConfigured()) {
      await ctx.send(errorReply(ctx, 'Handle Hunter is not available right now.'));
      return 'skipped';
    }

    const pooled = await takeFromPool().catch(() => null);
    const searched = pooled ? null : await findAvailableHandle().catch(() => null);
    const found: FoundHandle | null = pooled ?? (searched ? { handle: searched, at: Date.now() } : null);
    if (!found) {
      await ctx.send(errorReply(ctx, "I couldn't find an available handle right now. Try again in a moment."));
      return 'skipped';
    }

    const { handle, at } = found;
    const dm = themedReplyFor(
      null,
      false,
      'success',
      `Available **${handle.length}L** handle: \`${handle}\`\nDropped: ${discordTimestamp(at, 'R')}\nOpen Discord Settings and claim it before someone else does.`,
      { title: 'Handle Hunter', keepCode: true },
    );
    const sent = await ctx.user
      .send(dm)
      .then(() => true)
      .catch(() => false);
    if (!sent) {
      await db.set(POOL_COLLECTION, handle, { at: Date.now() });
      await ctx.send(errorReply(ctx, 'I could not DM you. Enable direct messages from this server and try again.'));
      return 'skipped';
    }

    await db.set(DELIVERED_COLLECTION, handle, { userId: ctx.user.id, at: Date.now() });
    await ctx.send(successReply(ctx, 'Check your DMs for your handle.'));
    return 'completed';
  },

  async unamepool(ctx) {
    if (!isOwner(ctx.user.id) && !(await isPremiumUser(ctx.user.id))) {
      await ctx.send(errorReply(ctx, 'Handle Hunter is available to **Premium** subscribers only.'));
      return 'skipped';
    }
    const pool = await db.all(POOL_COLLECTION);
    const fourLetter = pool.filter((entry) => entry.key.length === 4).length;
    const fiveLetter = pool.filter((entry) => entry.key.length === 5).length;
    await ctx.send(
      themedReplyFor(
        ctx.guild?.id ?? null,
        ctx.isInteraction,
        'success',
        `Ready handles: \`${pool.length}/${POOL_LIMIT}\`\n4L: \`${fourLetter}\`\n5L: \`${fiveLetter}\``,
        { title: 'Handle Hunter', keepCode: true },
      ),
    );
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
