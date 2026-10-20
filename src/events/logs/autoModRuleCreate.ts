import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, mention, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.AutoModerationRuleCreate,
  async execute(rule) {
    await emit(rule.guild, 'automod_rule_created', () => Promise.resolve({
      title: 'AutoMod Rule Created',
      kind: 'create',
      actorLabel: 'Created by',
      actor: rule.creatorId ? mention(rule.creatorId) : 'Unknown',
      fields: [
        ['Rule', `${rule.name} \`${rule.id}\``],
        ['Enabled', yesNo(rule.enabled)],
      ],
    }));
  },
});
