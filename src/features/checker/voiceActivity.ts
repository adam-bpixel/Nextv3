import type { Client } from 'discord.js';
import { ensureLoggedIn, isConfigured } from './selfbot';

export interface VoiceLocation {
  guildId: string;
  guildName: string;
  iconURL: string | null;
  channelId: string;
  channelName: string;
  members: string[];
}

export interface GuildVoiceSummary {
  id: string;
  name: string;
  iconURL: string | null;
  voice: number;
  total: number;
}

interface VoiceStateLike {
  id: string;
  channelId: string | null;
}

interface GuildLike {
  id: string;
  name: string;
  memberCount: number;
  iconURL(options?: { size?: number }): string | null;
  voiceStates: { cache: { values(): IterableIterator<VoiceStateLike> } };
  channels: { cache: { get(id: string): { name: string } | undefined } };
}

async function allGuilds(client: Client): Promise<GuildLike[]> {
  const guilds: GuildLike[] = [...client.guilds.cache.values()];
  if (!isConfigured()) return guilds;
  const self = await ensureLoggedIn().catch(() => null);
  if (self) guilds.push(...self.guilds.cache.values());
  return guilds;
}

export async function findVoiceLocations(client: Client, userId: string): Promise<VoiceLocation[]> {
  const guilds = await allGuilds(client);
  const seen = new Set<string>();
  const found: VoiceLocation[] = [];
  for (const guild of guilds) {
    const states = [...guild.voiceStates.cache.values()];
    const state = states.find((candidate) => candidate.id === userId);
    if (!state?.channelId || seen.has(`${guild.id}:${state.channelId}`)) continue;
    seen.add(`${guild.id}:${state.channelId}`);
    const members = states.filter((candidate) => candidate.channelId === state.channelId).map((candidate) => candidate.id);
    found.push({
      guildId: guild.id,
      guildName: guild.name,
      iconURL: guild.iconURL({ size: 256 }),
      channelId: state.channelId,
      channelName: guild.channels.cache.get(state.channelId)?.name ?? 'Unknown',
      members,
    });
  }
  return found;
}

export async function getVoiceLeaderboard(client: Client): Promise<GuildVoiceSummary[]> {
  const guilds = await allGuilds(client);
  const seen = new Set<string>();
  const entries: GuildVoiceSummary[] = [];
  for (const guild of guilds) {
    if (seen.has(guild.id)) continue;
    seen.add(guild.id);
    const voice = [...guild.voiceStates.cache.values()].filter((state) => state.channelId !== null).length;
    entries.push({ id: guild.id, name: guild.name, iconURL: guild.iconURL({ size: 256 }), voice, total: guild.memberCount });
  }
  return entries.sort((a, b) => b.voice - a.voice);
}
