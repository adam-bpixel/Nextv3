import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { primeInviteCache } from '../../features/invites/inviteTracker';

export default defineEvent({
  name: Events.GuildCreate,
  async execute(guild) {
    await primeInviteCache(guild);
  },
});
