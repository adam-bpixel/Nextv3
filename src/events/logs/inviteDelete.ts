import { AuditLogEvent, Events, Guild } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.InviteDelete,
  async execute(invite) {
    if (!(invite.guild instanceof Guild)) return;
    await emit(invite.guild, 'invite_deleted', async () => {
      const entry = await audit(invite.guild as Guild, [AuditLogEvent.InviteDelete], (e) => e.changes.some((c) => c.key === 'code' && c.old === invite.code));
      return done(entry, { title: 'Invite Deleted', kind: 'delete', fields: [['Code', invite.code], ['Channel', invite.channel ? `<#${invite.channel.id}>` : null]] });
    });
  },
});
