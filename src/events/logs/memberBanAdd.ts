import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildBanAdd,
  async execute(ban) {
    await emit(ban.guild, 'member_banned', async () => {
      const entry = await audit(ban.guild, [AuditLogEvent.MemberBanAdd], (e) => e.targetId === ban.user.id);
      return done(entry, {
        title: 'Member Banned',
        kind: 'delete',
        reason: entry?.reason ?? ban.reason ?? undefined,
        fields: [['Member', `${ban.user.tag} \`${ban.user.id}\``]],
      });
    });
  },
});
