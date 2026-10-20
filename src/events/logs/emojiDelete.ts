import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildEmojiDelete,
  async execute(emoji) {
    await emit(emoji.guild, 'emoji_deleted', async () => {
      const entry = await audit(emoji.guild, [AuditLogEvent.EmojiDelete], (e) => e.targetId === emoji.id);
      return done(entry, { title: 'Emoji Deleted', kind: 'delete', fields: [['Emoji', `${emoji.name} \`${emoji.id}\``], ['Name', emoji.name]] });
    });
  },
});
