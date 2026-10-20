import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, time } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildScheduledEventDelete,
  async execute(event) {
    const guild = event.guild;
    if (!guild) return;
    await emit(guild, 'event_deleted', () => Promise.resolve({
      title: 'Event Deleted',
      kind: 'delete',
      fields: [
        ['Event', `${event.name} \`${event.id}\``],
        ['Starts', event.scheduledStartTimestamp ? time(event.scheduledStartTimestamp) : null],
        ['Where', event.channelId ? `<#${event.channelId}>` : event.entityMetadata?.location],
      ],
    }));
  },
});
