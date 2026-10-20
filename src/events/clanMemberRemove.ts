import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { handleClanMemberLeave } from '../features/clans/clans.voice';

export default defineEvent({
  name: Events.GuildMemberRemove,
  async execute(member) {
    await handleClanMemberLeave(member);
  },
});
