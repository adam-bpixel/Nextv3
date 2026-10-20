import { AuditLogEvent, ChannelType, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit, human } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.ChannelCreate,
  async execute(channel) {
    await emit(channel.guild, 'channel_created', async () => {
      const entry = await audit(channel.guild, [AuditLogEvent.ChannelCreate], (e) => e.targetId === channel.id);
      return done(entry, {
        title: 'Channel Created',
        kind: 'create',
        fields: [
          ['Channel', `<#${channel.id}> \`${channel.id}\``],
          ['Type', human(ChannelType[channel.type])],
          ['Category', channel.parent?.name],
        ],
      });
    });
  },
});
