import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.AutoModerationRuleUpdate,
  async execute(before, after) {
    const fields = changes([
      ['Name', before?.name, after.name],
      ['Enabled', before ? yesNo(before.enabled) : undefined, yesNo(after.enabled)],
    ]);
    if (!fields.length) return;
    await emit(after.guild, 'automod_rule_updated', async () => {
      const entry = await audit(after.guild, [AuditLogEvent.AutoModerationRuleUpdate], (e) => e.targetId === after.id);
      return done(entry, { title: 'AutoMod Rule Updated', kind: 'update', fields: [['Rule', `${after.name} \`${after.id}\``], ...fields] });
    });
  },
});
