import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { actorText, audit, emit, mention } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.MessageDelete,
  async execute(message) {
    const guild = message.guild;
    if (!guild || message.author?.id === message.client.user.id) return;
    await emit(guild, 'message_deleted', async () => {
      const author = message.author;
      const entry = author
        ? await audit(guild, [AuditLogEvent.MessageDelete], (e) => e.targetId === author.id && e.extra.channel.id === message.channelId)
        : null;
      return {
        title: 'Message Deleted',
        kind: 'delete',
        fields: [
          ['Author', author ? mention(author.id) : '`Not cached`'],
          ['Channel', `<#${message.channelId}>`],
          ['Content', message.content || null],
          ['Attachments', message.attachments.size || null],
          ['Message ID', message.id],
        ],
        actorLabel: 'Deleted by',
        actor: entry ? actorText(entry) : author ? `${mention(author.id)} \`or unknown\`` : 'Unknown',
      };
    });
  },
});
