import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.MessageBulkDelete,
  async execute(messages, channel) {
    await emit(channel.guild, 'messages_bulk_deleted', async () => {
      const entry = await audit(channel.guild, [AuditLogEvent.MessageBulkDelete], (e) => e.targetId === channel.id);
      return done(entry, { title: 'Messages Bulk Deleted', kind: 'delete', fields: [['Channel', `<#${channel.id}>`], ['Messages', messages.size]] });
    });
  },
});
