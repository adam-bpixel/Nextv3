import db from '../../core/db';
import { isRecord } from '../../core/json';

const BLACKLIST = 'ownerBlacklist';
const STATE = 'ownerState';
const PROFILES = 'profileBackgrounds';
const OWNERSHIP = 'profileBackgroundOwnership';
const EQUIPPED = 'equippedProfileBackgrounds';
const COUNTERS = 'ownerCounters';
const BOOSTS = 'xpBoosts';
const SUGGESTIONS = 'suggestionSettings';

export interface BlacklistEntry {
  userId: string;
  reason: string;
  addedBy: string;
  addedAt: number;
}

let blacklistCache: Map<string, BlacklistEntry> | null = null;
let blacklistLoading: Promise<Map<string, BlacklistEntry>> | null = null;

async function blacklistEntries(): Promise<Map<string, BlacklistEntry>> {
  if (blacklistCache) return blacklistCache;
  blacklistLoading ??= db.all(BLACKLIST).then((entries) => {
    const parsed = new Map<string, BlacklistEntry>();
    for (const { key, value } of entries) {
      if (!isRecord(value)) continue;
      parsed.set(key, {
        userId: key,
        reason: typeof value.reason === 'string' ? value.reason : 'No reason provided',
        addedBy: typeof value.addedBy === 'string' ? value.addedBy : '',
        addedAt: typeof value.addedAt === 'number' ? value.addedAt : 0,
      });
    }
    blacklistCache = parsed;
    return parsed;
  }).finally(() => { blacklistLoading = null; });
  return blacklistLoading;
}

export async function getBlacklistEntry(userId: string): Promise<BlacklistEntry | null> {
  return (await blacklistEntries()).get(userId) ?? null;
}

export async function listBlacklist(): Promise<BlacklistEntry[]> {
  return [...(await blacklistEntries()).values()].sort((a, b) => b.addedAt - a.addedAt);
}

export async function addToBlacklist(userId: string, reason: string, addedBy: string): Promise<void> {
  const entry = { reason, addedBy, addedAt: Date.now() };
  await db.set(BLACKLIST, userId, entry);
  (await blacklistEntries()).set(userId, { userId, ...entry });
}

export async function removeFromBlacklist(userId: string): Promise<boolean> {
  const entries = await blacklistEntries();
  if (!entries.has(userId)) return false;
  await db.delete(BLACKLIST, userId);
  entries.delete(userId);
  return true;
}

let workModeCache: boolean | null = null;

export async function isWorkMode(): Promise<boolean> {
  if (workModeCache !== null) return workModeCache;
  const state = await db.get(STATE, 'workmode');
  workModeCache = isRecord(state) && state.enabled === true;
  return workModeCache;
}

export async function setWorkMode(enabled: boolean): Promise<void> {
  await db.set(STATE, 'workmode', { enabled });
  workModeCache = enabled;
}

export interface OwnerProfileBackground {
  id: number;
  imageUrl: string;
  previewUrl: string | null;
  name: string | null;
  price: number | null;
  stock: number | null;
  createdAt: number;
}

function parseProfile(id: string, value: unknown): OwnerProfileBackground | null {
  if (!isRecord(value)) return null;
  const profileId = typeof value.id === 'number' ? value.id : Number(id);
  if (!Number.isInteger(profileId) || typeof value.imageUrl !== 'string') return null;
  return {
    id: profileId,
    imageUrl: value.imageUrl,
    previewUrl: typeof value.previewUrl === 'string' ? value.previewUrl : null,
    name: typeof value.name === 'string' ? value.name : null,
    price: typeof value.price === 'number' ? value.price : null,
    stock: typeof value.stock === 'number' ? value.stock : null,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : 0,
  };
}

export async function createProfileBackground(imageUrl: string, previewUrl: string | null = null): Promise<OwnerProfileBackground> {
  const previous = await db.get(COUNTERS, 'profileBackground');
  const id = (typeof previous === 'number' ? previous : 0) + 1;
  await db.set(COUNTERS, 'profileBackground', id);
  const profile = { id, imageUrl, previewUrl, name: null, price: null, stock: null, createdAt: Date.now() };
  await db.set(PROFILES, String(id), profile);
  return profile;
}

export async function getProfileBackground(id: number): Promise<OwnerProfileBackground | null> {
  return parseProfile(String(id), await db.get(PROFILES, String(id)));
}

export async function listProfileBackgrounds(): Promise<OwnerProfileBackground[]> {
  const entries = await db.all(PROFILES);
  return entries.map(({ key, value }) => parseProfile(key, value)).filter((item): item is OwnerProfileBackground => item !== null).sort((a, b) => a.id - b.id);
}

export async function listProfileShopListings(): Promise<OwnerProfileBackground[]> {
  return (await listProfileBackgrounds()).filter((profile) => profile.name !== null && profile.price !== null && profile.stock !== null);
}

export async function takeProfileBackgroundStock(id: number): Promise<boolean> {
  const profile = await getProfileBackground(id);
  if (!profile || profile.name === null || profile.price === null || profile.stock === null) return false;
  if (profile.stock === -1) return true;
  if (profile.stock < 1) return false;
  await updateProfileBackground(id, { stock: profile.stock - 1 });
  return true;
}

export async function refundProfileBackgroundStock(id: number): Promise<void> {
  const profile = await getProfileBackground(id);
  if (!profile || profile.stock === null || profile.stock < 0) return;
  await updateProfileBackground(id, { stock: profile.stock + 1 });
}

export async function updateProfileBackground(id: number, patch: Partial<Pick<OwnerProfileBackground, 'name' | 'price' | 'stock'>>): Promise<boolean> {
  const profile = await getProfileBackground(id);
  if (!profile) return false;
  await db.set(PROFILES, String(id), { ...profile, ...patch });
  return true;
}

export async function saveProfileBackgroundPreview(id: number, previewUrl: string): Promise<boolean> {
  const profile = await getProfileBackground(id);
  if (!profile) return false;
  await db.set(PROFILES, String(id), { ...profile, previewUrl });
  return true;
}

export async function deleteProfileBackground(id: number): Promise<boolean> {
  if (!(await getProfileBackground(id))) return false;
  await db.delete(PROFILES, String(id));
  for (const { key, value } of await db.all(OWNERSHIP)) {
    if (isRecord(value) && value.profileId === id) await db.delete(OWNERSHIP, key);
  }
  return true;
}

export async function giveProfileBackground(userId: string, id: number): Promise<boolean> {
  if (!(await getProfileBackground(id))) return false;
  await db.set(OWNERSHIP, `${userId}:${id}`, { userId, profileId: id, acquiredAt: Date.now() });
  return true;
}

export async function removeProfileBackground(userId: string, id: number): Promise<boolean> {
  const key = `${userId}:${id}`;
  if (!(await db.get(OWNERSHIP, key))) return false;
  await db.delete(OWNERSHIP, key);
  if (await db.get(EQUIPPED, userId) === id) await db.delete(EQUIPPED, userId);
  return true;
}

export async function ownsProfileBackground(userId: string, id: number): Promise<boolean> {
  return Boolean(await db.get(OWNERSHIP, `${userId}:${id}`));
}

export async function equipProfileBackground(userId: string, id: number): Promise<boolean> {
  if (!(await ownsProfileBackground(userId, id))) return false;
  await db.set(EQUIPPED, userId, id);
  return true;
}

export async function clearEquippedProfileBackground(userId: string): Promise<void> {
  await db.delete(EQUIPPED, userId);
}

export async function ownedProfileBackgrounds(userId: string): Promise<OwnerProfileBackground[]> {
  const owned = (await db.allByField(OWNERSHIP, 'userId', userId))
    .map(({ value }) => value)
    .filter((value) => isRecord(value) && value.userId === userId && typeof value.profileId === 'number')
    .map((value) => (value as Record<string, unknown>).profileId as number);
  const profiles = await db.getMany(PROFILES, owned.map(String));
  return profiles
    .map(({ key, value }) => parseProfile(key, value))
    .filter((profile): profile is OwnerProfileBackground => profile !== null)
    .sort((a, b) => a.id - b.id);
}

export async function equippedProfileBackground(userId: string): Promise<OwnerProfileBackground | null> {
  const id = await db.get(EQUIPPED, userId);
  return typeof id === 'number' ? getProfileBackground(id) : null;
}

export async function setProfileShopListing(id: number, patch: Pick<OwnerProfileBackground, 'name' | 'price' | 'stock'>): Promise<boolean> {
  return updateProfileBackground(id, patch);
}

export async function removeProfileShopListing(id: number): Promise<boolean> {
  return updateProfileBackground(id, { name: null, price: null, stock: null });
}

export async function giveXpBoost(userId: string, multiplier: number, durationMs: number): Promise<number> {
  const expiresAt = Date.now() + durationMs;
  await db.set(BOOSTS, userId, { multiplier, expiresAt });
  return expiresAt;
}

export async function xpBoostMultiplier(userId: string): Promise<number> {
  const value = await db.get(BOOSTS, userId);
  if (!isRecord(value) || typeof value.multiplier !== 'number' || typeof value.expiresAt !== 'number') return 1;
  if (value.expiresAt <= Date.now()) {
    await db.delete(BOOSTS, userId);
    return 1;
  }
  return Math.max(1, value.multiplier);
}

export async function activeXpBoost(userId: string): Promise<{ multiplier: number; expiresAt: number } | null> {
  const value = await db.get(BOOSTS, userId);
  if (!isRecord(value) || typeof value.multiplier !== 'number' || typeof value.expiresAt !== 'number') return null;
  if (value.expiresAt <= Date.now()) {
    await db.delete(BOOSTS, userId);
    return null;
  }
  return { multiplier: value.multiplier, expiresAt: value.expiresAt };
}

export interface SuggestionSettings {
  panelChannelId: string;
  reviewChannelId: string;
  panelMessageId: string;
}

export async function getSuggestionSettings(guildId: string): Promise<Partial<SuggestionSettings>> {
  const value = await db.get(SUGGESTIONS, guildId);
  if (!isRecord(value)) return {};
  return {
    ...(typeof value.panelChannelId === 'string' ? { panelChannelId: value.panelChannelId } : {}),
    ...(typeof value.reviewChannelId === 'string' ? { reviewChannelId: value.reviewChannelId } : {}),
    ...(typeof value.panelMessageId === 'string' ? { panelMessageId: value.panelMessageId } : {}),
  };
}

export async function saveSuggestionSettings(guildId: string, settings: SuggestionSettings): Promise<void> {
  await db.set(SUGGESTIONS, guildId, settings);
}
