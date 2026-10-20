import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildStickerUpdate,
  async execute(before, after) {
    const guild = after.guild;
    if (!guild) return;
    const fields = changes([
      ['Name', before.name, after.name],
      ['Description', before.description, after.description],
      ['Tags', before.tags, after.tags],
    ]);
    if (!fields.length) return;
    await emit(guild, 'sticker_updated', async () => {
      const entry = await audit(guild, [AuditLogEvent.StickerUpdate], (e) => e.targetId === after.id);
      return done(entry, { title: 'Sticker Updated', kind: 'update', fields: [['Sticker', `${after.name} \`${after.id}\``], ...fields] });
    });
  },
});
