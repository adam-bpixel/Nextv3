import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildEmojiUpdate,
  async execute(before, after) {
    const fields = changes([['Name', before.name, after.name]]);
    if (!fields.length) return;
    await emit(after.guild, 'emoji_updated', async () => {
      const entry = await audit(after.guild, [AuditLogEvent.EmojiUpdate], (e) => e.targetId === after.id);
      return done(entry, { title: 'Emoji Updated', kind: 'update', fields: [['Emoji', `${after.animated ? '<a:' : '<:'}${after.name}:${after.id}> \`${after.id}\``], ...fields] });
    });
  },
});
