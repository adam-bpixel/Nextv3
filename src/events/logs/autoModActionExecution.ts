import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, mention } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.AutoModerationActionExecution,
  async execute(execution) {
    await emit(execution.guild, 'automod_blocked', () => Promise.resolve({
      title: 'AutoMod Action',
      kind: 'warn',
      actorLabel: 'Member',
      actor: mention(execution.userId),
      fields: [
        ['Rule', execution.autoModerationRule?.name ?? execution.ruleId],
        ['Channel', execution.channelId ? `<#${execution.channelId}>` : null],
        ['Matched', execution.matchedKeyword ?? execution.matchedContent],
        ['Content', execution.content],
      ],
    }));
  },
});
