import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildEmojiCreate,
  async execute(emoji) {
    await emit(emoji.guild, 'emoji_created', async () => {
      const entry = await audit(emoji.guild, [AuditLogEvent.EmojiCreate], (e) => e.targetId === emoji.id);
      return done(entry, {
        title: 'Emoji Created',
        kind: 'create',
        fields: [
          ['Emoji', `${emoji.animated ? '<a:' : '<:'}${emoji.name}:${emoji.id}> \`${emoji.id}\``],
          ['Name', emoji.name],
        ],
      });
    });
  },
});
