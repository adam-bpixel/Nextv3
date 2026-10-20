import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildStickerDelete,
  async execute(sticker) {
    const guild = sticker.guild;
    if (!guild) return;
    await emit(guild, 'sticker_deleted', async () => {
      const entry = await audit(guild, [AuditLogEvent.StickerDelete], (e) => e.targetId === sticker.id);
      return done(entry, { title: 'Sticker Deleted', kind: 'delete', fields: [['Sticker', `${sticker.name} \`${sticker.id}\``], ['Description', sticker.description]] });
    });
  },
});
