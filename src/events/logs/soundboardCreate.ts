import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildSoundboardSoundCreate,
  async execute(sound) {
    const guild = sound.guild;
    await emit(guild, 'sound_created', async () => {
      const entry = await audit(guild, [AuditLogEvent.SoundboardSoundCreate], (e) => e.targetId === sound.soundId);
      return done(entry, { title: 'Sound Created', kind: 'create', fields: [['Sound', `${sound.name} \`${sound.soundId}\``], ['Volume', sound.volume]] });
    });
  },
});
