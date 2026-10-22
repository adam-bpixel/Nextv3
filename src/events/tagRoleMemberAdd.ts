import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { syncMemberTagRole } from '../features/tagrole/tagrole.model';

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    await syncMemberTagRole(member).catch(() => undefined);
  },
});
