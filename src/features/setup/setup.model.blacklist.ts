import db from '../../core/db';
import { COLLECTION, getGuildSetup } from './setup.model.core';

export const MAX_BLACKLISTED_CHANNELS = 15;

export async function addBlacklistedChannel(guildId: string, channelId: string): Promise<string[]> {
  const setup = await getGuildSetup(guildId);
  const existing = setup.blacklistedChannelIds ?? [];
  if (existing.includes(channelId)) return existing;
  if (existing.length >= MAX_BLACKLISTED_CHANNELS) throw new Error(`You can block up to ${MAX_BLACKLISTED_CHANNELS} channels.`);
  const blacklistedChannelIds = [...existing, channelId];
  await db.set(COLLECTION, guildId, { ...setup, blacklistedChannelIds });
  return blacklistedChannelIds;
}

export async function removeBlacklistedChannel(guildId: string, channelId: string): Promise<string[]> {
  const setup = await getGuildSetup(guildId);
  const blacklistedChannelIds = (setup.blacklistedChannelIds ?? []).filter((id) => id !== channelId);
  await db.set(COLLECTION, guildId, { ...setup, blacklistedChannelIds });
  return blacklistedChannelIds;
}

export async function isBlacklistedChannel(guildId: string, channelId: string): Promise<boolean> {
  const setup = await getGuildSetup(guildId);
  return (setup.blacklistedChannelIds ?? []).includes(channelId);
}
