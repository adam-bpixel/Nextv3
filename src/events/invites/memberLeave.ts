import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { markLeft } from '../../features/invites/invites.model';

export default defineEvent({
  name: Events.GuildMemberRemove,
  async execute(member) {
    await markLeft(member.guild.id, member.id);
  },
});
