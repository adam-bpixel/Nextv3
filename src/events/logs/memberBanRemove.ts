import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildBanRemove,
  async execute(ban) {
    await emit(ban.guild, 'member_unbanned', async () => {
      const entry = await audit(ban.guild, [AuditLogEvent.MemberBanRemove], (e) => e.targetId === ban.user.id);
      return done(entry, { title: 'Member Unbanned', kind: 'create', fields: [['Member', `${ban.user.tag} \`${ban.user.id}\``]] });
    });
  },
});
