import { AuditLogEvent, ChannelType, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit, human } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.ChannelDelete,
  async execute(channel) {
    if (channel.isDMBased()) return;
    await emit(channel.guild, 'channel_deleted', async () => {
      const entry = await audit(channel.guild, [AuditLogEvent.ChannelDelete], (e) => e.targetId === channel.id);
      return done(entry, {
        title: 'Channel Deleted',
        kind: 'delete',
        fields: [
          ['Channel', `#${channel.name} \`${channel.id}\``],
          ['Type', human(ChannelType[channel.type])],
          ['Category', channel.parent?.name],
        ],
      });
    });
  },
});
