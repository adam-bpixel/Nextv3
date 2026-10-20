import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.ThreadDelete,
  async execute(thread) {
    await emit(thread.guild, 'thread_deleted', async () => {
      const entry = await audit(thread.guild, [AuditLogEvent.ThreadDelete], (e) => e.targetId === thread.id);
      return done(entry, { title: 'Thread Deleted', kind: 'delete', fields: [['Thread', `${thread.name} \`${thread.id}\``], ['Parent', thread.parentId ? `<#${thread.parentId}>` : null]] });
    });
  },
});
