import db from '../../core/db';

const COLLECTION = 'badWords';
const CACHE_TTL_MS = 30_000;

export const MAX_BAD_WORDS = 50;
export const MAX_BAD_WORD_LENGTH = 30;

const cache = new Map<string, { at: number; words: string[] }>();

function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase().trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getBadWords(guildId: string): Promise<string[]> {
  const cached = cache.get(guildId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.words;
  const value = await db.get(COLLECTION, guildId);
  const words = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  cache.set(guildId, { at: Date.now(), words });
  return words;
}

async function saveBadWords(guildId: string, words: string[]): Promise<void> {
  await db.set(COLLECTION, guildId, words);
  cache.set(guildId, { at: Date.now(), words });
}

export interface AddBadWordsResult {
  added: string[];
  tooLong: string[];
  limitReached: boolean;
}

export async function addBadWords(guildId: string, rawWords: readonly string[]): Promise<AddBadWordsResult> {
  const current = await getBadWords(guildId);
  const updated = [...current];
  const result: AddBadWordsResult = { added: [], tooLong: [], limitReached: false };
  for (const raw of rawWords) {
    const word = normalize(raw);
    if (!word || updated.includes(word)) continue;
    if (word.length > MAX_BAD_WORD_LENGTH) {
      result.tooLong.push(word.slice(0, 12) + '...');
      continue;
    }
    if (updated.length >= MAX_BAD_WORDS) {
      result.limitReached = true;
      break;
    }
    updated.push(word);
    result.added.push(word);
  }
  if (result.added.length) await saveBadWords(guildId, updated);
  return result;
}

export async function removeBadWords(guildId: string, words: readonly string[]): Promise<void> {
  const remove = new Set(words.map(normalize));
  const updated = (await getBadWords(guildId)).filter((word) => !remove.has(word));
  await saveBadWords(guildId, updated);
}

export async function findBadWord(guildId: string, content: string): Promise<string | null> {
  const words = await getBadWords(guildId);
  if (!words.length) return null;
  const text = normalize(content);
  for (const word of words) {
    if (new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(word)}(?![\\p{L}\\p{N}])`, 'u').test(text)) return word;
  }
  return null;
}
