import db from '../../core/db';
import { type AutoReplyEntry, COLLECTION, getGuildSetup, type GuildSetup } from './setup.model.core';

export const MAX_AUTO_REPLIES = 25;

export async function addAutoReply(guildId: string, entry: AutoReplyEntry): Promise<AutoReplyEntry[]> {
  const setup = await getGuildSetup(guildId);
  const entries = setup.autoReplies ?? [];
  if (entries.length >= MAX_AUTO_REPLIES) throw new Error(`You can add up to ${MAX_AUTO_REPLIES} auto-replies.`);
  const autoReplies = [...entries, entry];
  await db.set(COLLECTION, guildId, { ...setup, autoReplies });
  return autoReplies;
}

export async function removeAutoReply(guildId: string, entryId: string): Promise<AutoReplyEntry[]> {
  const setup = await getGuildSetup(guildId);
  const autoReplies = (setup.autoReplies ?? []).filter((entry) => entry.id !== entryId);
  await db.set(COLLECTION, guildId, { ...setup, autoReplies });
  return autoReplies;
}

export function findAutoReplyMatch(setup: GuildSetup, content: string): AutoReplyEntry | undefined {
  const normalized = content.trim().toLowerCase();
  if (!normalized) return undefined;
  return (setup.autoReplies ?? []).find((entry) => {
    const trigger = entry.trigger.toLowerCase();
    return entry.matchType === 'exact' ? normalized === trigger : normalized.includes(trigger);
  });
}
