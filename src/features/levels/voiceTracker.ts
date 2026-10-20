import type { Client, Guild, GuildMember } from 'discord.js';
import config from '../../core/config';
import { award, grantLevelRoles } from './levels.model';

interface VoiceMember {
  guild: Guild;
  member: GuildMember;
}

function eligibleVoiceMembers(client: Client): VoiceMember[] {
  const members: VoiceMember[] = [];
  for (const guild of client.guilds.cache.values()) {
    for (const state of guild.voiceStates.cache.values()) {
      if (!state.channelId || state.channelId === guild.afkChannelId) continue;
      if (!state.member || state.member.user.bot) continue;
      members.push({ guild, member: state.member });
    }
  }
  return members;
}

export function startVoiceXpTracking(client: Client): void {
  if (!config.levels.enabled) return;
  setInterval(() => {
    for (const { guild, member } of eligibleVoiceMembers(client)) {
      award(guild.id, member.id, 'voice')
        .then((reachedLevel) => (reachedLevel ? grantLevelRoles(guild, member, 'voice', reachedLevel) : undefined))
        .catch((error: unknown) => console.error('Granting voice level roles failed:', error));
    }
  }, config.levels.voice.intervalSeconds * 1000);
}
