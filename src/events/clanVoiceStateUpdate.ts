import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { trackClanVoiceChange } from '../features/clans/clans.voice';

export default defineEvent({
  name: Events.VoiceStateUpdate,
  async execute(_oldState, newState) {
    await trackClanVoiceChange(newState);
  },
});
