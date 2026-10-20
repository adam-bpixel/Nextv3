import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildScheduledEventUpdate,
  async execute(before, after) {
    const guild = after.guild;
    if (!guild) return;
    const fields = changes([
      ['Name', before?.name, after.name],
      ['Description', before?.description, after.description],
      ['Status', before?.status, after.status],
    ]);
    if (!fields.length) return;
    await emit(guild, 'event_updated', async () => {
      const entry = await audit(guild, [AuditLogEvent.GuildScheduledEventUpdate], (e) => e.targetId === after.id);
      return done(entry, { title: 'Event Updated', kind: 'update', fields: [['Event', `${after.name} \`${after.id}\``], ...fields] });
    });
  },
});
