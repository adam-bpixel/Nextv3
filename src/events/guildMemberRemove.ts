import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { syncVoiceCountChannel } from '../features/voice/voiceCount.service';

export default defineEvent({
  name: Events.GuildMemberRemove,
  async execute(member) {
    await syncVoiceCountChannel(member.guild);
  },
});
