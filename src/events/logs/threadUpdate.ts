import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.ThreadUpdate,
  async execute(before, after) {
    const fields = changes([
      ['Name', before.name, after.name],
      ['Archived', yesNo(before.archived ?? false), yesNo(after.archived ?? false)],
      ['Locked', yesNo(before.locked ?? false), yesNo(after.locked ?? false)],
      ['Auto archive minutes', before.autoArchiveDuration, after.autoArchiveDuration],
      ['Slowmode', before.rateLimitPerUser, after.rateLimitPerUser],
    ]);
    if (!fields.length) return;
    await emit(after.guild, 'thread_updated', async () => {
      const entry = await audit(after.guild, [AuditLogEvent.ThreadUpdate], (e) => e.targetId === after.id);
      return done(entry, { title: 'Thread Updated', kind: 'update', fields: [['Thread', `<#${after.id}> \`${after.id}\``], ...fields] });
    });
  },
});
