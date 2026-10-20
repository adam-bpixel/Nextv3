import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, mention, time } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildScheduledEventCreate,
  async execute(event) {
    const guild = event.guild;
    if (!guild) return;
    await emit(guild, 'event_created', () => Promise.resolve({
      title: 'Event Created',
      kind: 'create',
      actorLabel: 'Created by',
      actor: event.creatorId ? mention(event.creatorId) : 'Unknown',
      fields: [
        ['Event', `${event.name} \`${event.id}\``],
        ['Starts', event.scheduledStartTimestamp ? time(event.scheduledStartTimestamp) : null],
        ['Where', event.channelId ? `<#${event.channelId}>` : event.entityMetadata?.location],
      ],
    }));
  },
});
