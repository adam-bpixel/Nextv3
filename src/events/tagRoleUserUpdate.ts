import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { syncMemberTagRole } from '../features/tagrole/tagrole.model';

export default defineEvent({
  name: Events.UserUpdate,
  async execute(_oldUser, newUser) {
    for (const guild of newUser.client.guilds.cache.values()) {
      const member = guild.members.cache.get(newUser.id);
      if (member) await syncMemberTagRole(member).catch(() => undefined);
    }
  },
});
