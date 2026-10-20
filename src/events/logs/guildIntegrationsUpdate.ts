import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildIntegrationsUpdate,
  async execute(guild) {
    await emit(guild, ['integration_created', 'integration_updated', 'integration_deleted'], async () => {
      const entry = await audit(
        guild,
        [AuditLogEvent.IntegrationCreate, AuditLogEvent.IntegrationUpdate, AuditLogEvent.IntegrationDelete],
        () => true,
        { claim: true },
      );
      if (!entry) return null;
      const name = entry.changes.find((c) => c.key === 'name');
      const type = entry.changes.find((c) => c.key === 'type');
      const created = entry.action === AuditLogEvent.IntegrationCreate;
      const deleted = entry.action === AuditLogEvent.IntegrationDelete;
      return done(entry, {
        event: created ? 'integration_created' : deleted ? 'integration_deleted' : 'integration_updated',
        title: created ? 'Integration Created' : deleted ? 'Integration Deleted' : 'Integration Updated',
        kind: created ? 'create' : deleted ? 'delete' : 'update',
        fields: [
          ['Integration', `${String(name?.new ?? name?.old ?? 'Unknown')} \`${entry.targetId}\``],
          ['Type', type?.new !== undefined ? String(type.new) : type?.old !== undefined ? String(type.old) : null],
        ],
      });
    });
  },
});
