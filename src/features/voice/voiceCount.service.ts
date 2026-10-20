import type { Guild } from 'discord.js';
import { getVoiceCountSetup } from '../setup/setup.model';

const RENAME_COOLDOWN_MS = 10 * 60 * 1000;
const lastRenameAt = new Map<string, number>();
const LAST_NUMBER = /\d+(?!.*\d)/;

export async function syncVoiceCountChannel(guild: Guild): Promise<void> {
  const settings = await getVoiceCountSetup(guild.id);
  if (!settings.enabled || !settings.channelId) return;
  const last = lastRenameAt.get(guild.id) ?? 0;
  if (Date.now() - last < RENAME_COOLDOWN_MS) return;
  const channel = guild.channels.cache.get(settings.channelId);
  if (!channel) return;
  const name = (LAST_NUMBER.test(channel.name) ? channel.name.replace(LAST_NUMBER, String(guild.memberCount)) : `${channel.name} : ${guild.memberCount}`).slice(0, 100);
  if (name === channel.name) return;
  lastRenameAt.set(guild.id, Date.now());
  await channel.setName(name).catch(() => undefined);
}
