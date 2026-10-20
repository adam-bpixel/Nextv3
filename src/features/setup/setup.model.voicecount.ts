import db from '../../core/db';
import { COLLECTION, getGuildSetup, type VoiceCountSettings } from './setup.model.core';

const DEFAULT_VOICE_COUNT: VoiceCountSettings = { enabled: false, channelId: null };

export async function getVoiceCountSetup(guildId: string): Promise<VoiceCountSettings> {
  return (await getGuildSetup(guildId)).voiceCount ?? DEFAULT_VOICE_COUNT;
}

export async function setVoiceCountSettings(guildId: string, patch: Partial<VoiceCountSettings>): Promise<VoiceCountSettings> {
  const setup = await getGuildSetup(guildId);
  const next = { ...(setup.voiceCount ?? DEFAULT_VOICE_COUNT), ...patch };
  await db.set(COLLECTION, guildId, { ...setup, voiceCount: next });
  return next;
}
