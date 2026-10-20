import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildSoundboardSoundUpdate,
  async execute(before, after) {
    const guild = after.guild;
    const fields = changes([
      ['Name', before?.name, after.name],
      ['Volume', before?.volume, after.volume],
    ]);
    if (!fields.length) return;
    await emit(guild, 'sound_updated', async () => {
      const entry = await audit(guild, [AuditLogEvent.SoundboardSoundUpdate], (e) => e.targetId === after.soundId);
      return done(entry, { title: 'Sound Updated', kind: 'update', fields: [['Sound', `${after.name} \`${after.soundId}\``], ...fields] });
    });
  },
});
