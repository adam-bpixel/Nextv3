import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildStickerCreate,
  async execute(sticker) {
    const guild = sticker.guild;
    if (!guild) return;
    await emit(guild, 'sticker_created', async () => {
      const entry = await audit(guild, [AuditLogEvent.StickerCreate], (e) => e.targetId === sticker.id);
      return done(entry, { title: 'Sticker Created', kind: 'create', fields: [['Sticker', `${sticker.name} \`${sticker.id}\``], ['Description', sticker.description]] });
    });
  },
});
