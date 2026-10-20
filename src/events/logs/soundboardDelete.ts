import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildSoundboardSoundDelete,
  async execute(sound) {
    const guild = sound.guild;
    if (!guild) return;
    await emit(guild, 'sound_deleted', async () => {
      const entry = await audit(guild, [AuditLogEvent.SoundboardSoundDelete], (e) => e.targetId === sound.soundId);
      return done(entry, { title: 'Sound Deleted', kind: 'delete', fields: [['Sound', `${sound.name ?? 'Unknown'} \`${sound.soundId}\``]] });
    });
  },
});
