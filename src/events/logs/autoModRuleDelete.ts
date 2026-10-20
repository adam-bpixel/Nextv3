import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.AutoModerationRuleDelete,
  async execute(rule) {
    await emit(rule.guild, 'automod_rule_deleted', async () => {
      const entry = await audit(rule.guild, [AuditLogEvent.AutoModerationRuleDelete], (e) => e.targetId === rule.id);
      return done(entry, { title: 'AutoMod Rule Deleted', kind: 'delete', fields: [['Rule', `${rule.name} \`${rule.id}\``], ['Enabled', yesNo(rule.enabled)]] });
    });
  },
});
