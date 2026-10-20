import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, mention } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.ThreadCreate,
  async execute(thread, newlyCreated) {
    if (!newlyCreated) return;
    await emit(thread.guild, 'thread_created', () => Promise.resolve({
      title: 'Thread Created',
      kind: 'create',
      actorLabel: 'Created by',
      actor: thread.ownerId ? mention(thread.ownerId) : 'Unknown',
      fields: [
        ['Thread', `<#${thread.id}> \`${thread.id}\``],
        ['Parent', thread.parentId ? `<#${thread.parentId}>` : null],
      ],
    }));
  },
});
