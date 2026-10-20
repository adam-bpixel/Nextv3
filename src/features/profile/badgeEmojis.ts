import type { Client } from 'discord.js';
import type { ProfileBadge } from './badges';

interface AppEmoji {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}

let emojiCache: Map<string, AppEmoji> | null = null;
let loadingPromise: Promise<Map<string, AppEmoji>> | null = null;

async function loadApplicationEmojis(client: Client): Promise<Map<string, AppEmoji>> {
  if (emojiCache) return emojiCache;
  loadingPromise ??= (async () => {
    if (!client.application) throw new Error('Bot application is not ready yet.');
    const emojis = await client.application.emojis.fetch();
    const map = new Map<string, AppEmoji>();
    for (const emoji of emojis.values()) {
      if (emoji.name) map.set(emoji.name.toLowerCase(), { id: emoji.id, name: emoji.name, animated: emoji.animated, url: emoji.imageURL() });
    }
    emojiCache = map;
    return map;
  })().catch((error: unknown) => {
    loadingPromise = null;
    throw error;
  });
  return loadingPromise;
}

function findBadgeEmoji(map: Map<string, AppEmoji>, badgeId: string): AppEmoji | undefined {
  return map.get(`b_${badgeId}`.toLowerCase()) ?? map.get(badgeId.toLowerCase());
}


export async function resolveBadgeEmojiURLs(client: Client, badges: readonly ProfileBadge[]): Promise<string[]> {
  if (badges.length === 0) return [];
  const map = await loadApplicationEmojis(client).catch(() => new Map<string, AppEmoji>());
  const urls: string[] = [];
  for (const badge of badges) {
    const emojiURL = findBadgeEmoji(map, badge.id)?.url;
    if (emojiURL) {
      urls.push(emojiURL);
    } else if (badge.icon) {
      urls.push(`https://cdn.discordapp.com/badge-icons/${badge.icon}.png`);
    }
  }
  return urls;
}


export async function resolveBadgeEmojiMentions(client: Client, badgeIds: readonly string[]): Promise<string[]> {
  if (badgeIds.length === 0) return [];
  const map = await loadApplicationEmojis(client).catch(() => new Map<string, AppEmoji>());
  const mentions: string[] = [];
  for (const id of badgeIds) {
    const emoji = findBadgeEmoji(map, id);
    if (emoji) mentions.push(`<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`);
  }
  return mentions;
}
