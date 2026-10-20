import db from '../../core/db';
import { isRecord } from '../../core/json';

const GUILD_PREMIUM = 'premiumGuilds';
const USER_PREMIUM = 'premiumUsers';
const GUILD_PROFILES = 'guildProfiles';

export interface PremiumStatus {
  expiresAt: number;
  grantedBy: string;
}

export interface GuildProfile {
  name: string | null;
  avatarURL: string | null;
  bannerURL: string | null;
  bio: string | null;
}

const EMPTY_PROFILE: GuildProfile = { name: null, avatarURL: null, bannerURL: null, bio: null };

function readStatus(value: unknown): PremiumStatus | null {
  if (!isRecord(value) || typeof value.expiresAt !== 'number' || typeof value.grantedBy !== 'string') return null;
  return { expiresAt: value.expiresAt, grantedBy: value.grantedBy };
}

async function grantPremium(collection: string, id: string, durationMs: number, grantedBy: string): Promise<number> {
  const expiresAt = Date.now() + durationMs;
  await db.set(collection, id, { expiresAt, grantedBy });
  return expiresAt;
}

async function revokePremium(collection: string, id: string): Promise<boolean> {
  const status = readStatus(await db.get(collection, id));
  if (!status) return false;
  await db.delete(collection, id);
  return true;
}

async function premiumStatus(collection: string, id: string): Promise<PremiumStatus | null> {
  const status = readStatus(await db.get(collection, id));
  if (!status) return null;
  if (status.expiresAt <= Date.now()) {
    await db.delete(collection, id);
    return null;
  }
  return status;
}

export const grantGuildPremium = (guildId: string, durationMs: number, grantedBy: string): Promise<number> =>
  grantPremium(GUILD_PREMIUM, guildId, durationMs, grantedBy);

export const grantUserPremium = (userId: string, durationMs: number, grantedBy: string): Promise<number> =>
  grantPremium(USER_PREMIUM, userId, durationMs, grantedBy);

export const revokeGuildPremium = (guildId: string): Promise<boolean> => revokePremium(GUILD_PREMIUM, guildId);

export const revokeUserPremium = (userId: string): Promise<boolean> => revokePremium(USER_PREMIUM, userId);

export const guildPremiumStatus = (guildId: string): Promise<PremiumStatus | null> => premiumStatus(GUILD_PREMIUM, guildId);

export const userPremiumStatus = (userId: string): Promise<PremiumStatus | null> => premiumStatus(USER_PREMIUM, userId);

export async function isPremiumGuild(guildId: string): Promise<boolean> {
  return (await guildPremiumStatus(guildId)) !== null;
}

export async function isPremiumUser(userId: string): Promise<boolean> {
  return (await userPremiumStatus(userId)) !== null;
}

export async function getGuildProfile(guildId: string): Promise<GuildProfile> {
  const value = await db.get(GUILD_PROFILES, guildId);
  if (!isRecord(value)) return EMPTY_PROFILE;
  return {
    name: typeof value.name === 'string' ? value.name : null,
    avatarURL: typeof value.avatarURL === 'string' ? value.avatarURL : null,
    bannerURL: typeof value.bannerURL === 'string' ? value.bannerURL : null,
    bio: typeof value.bio === 'string' ? value.bio : null,
  };
}

export async function setGuildProfileField(guildId: string, field: keyof GuildProfile, value: string | null): Promise<GuildProfile> {
  const current = await getGuildProfile(guildId);
  const updated: GuildProfile = { ...current, [field]: value };
  await db.set(GUILD_PROFILES, guildId, updated);
  return updated;
}
