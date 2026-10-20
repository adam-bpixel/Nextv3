import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.WebhooksUpdate,
  async execute(channel) {
    await emit(channel.guild, ['webhook_created', 'webhook_updated', 'webhook_deleted'], async () => {
      const entry = await audit(
        channel.guild,
        [AuditLogEvent.WebhookCreate, AuditLogEvent.WebhookUpdate, AuditLogEvent.WebhookDelete],
        (e) => {
          const target = e.changes.find((c) => c.key === 'channel_id');
          return !target || (target.new ?? target.old) === channel.id;
        },
        { claim: true },
      );
      if (!entry) return null;
      const name = entry.changes.find((c) => c.key === 'name');
      const created = entry.action === AuditLogEvent.WebhookCreate;
      const deleted = entry.action === AuditLogEvent.WebhookDelete;
      return done(entry, {
        event: created ? 'webhook_created' : deleted ? 'webhook_deleted' : 'webhook_updated',
        title: created ? 'Webhook Created' : deleted ? 'Webhook Deleted' : 'Webhook Updated',
        kind: created ? 'create' : deleted ? 'delete' : 'update',
        fields: [
          ['Webhook', `${String(name?.new ?? name?.old ?? 'Unknown')} \`${entry.targetId}\``],
          ['Channel', `<#${channel.id}>`],
        ],
      });
    });
  },
});
