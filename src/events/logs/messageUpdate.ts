import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, mention } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.MessageUpdate,
  async execute(before, after) {
    const guild = after.guild;
    if (!guild || after.author.bot) return;
    await emit(guild, 'message_edited', () => {
      if (before.content === after.content) return Promise.resolve(null);
      return Promise.resolve({
        title: 'Message Edited',
        kind: 'update' as const,
        actorLabel: 'Author',
        actor: mention(after.author.id),
        fields: [
          ['Channel', `<#${after.channelId}>`],
          ['Before', before.content || '`Not cached`'],
          ['After', after.content],
          ['Jump', after.url],
        ] as const,
      });
    });
  },
});
