import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildUpdate,
  async execute(before, after) {
    const fields = [
      ...changes([
        ['Name', before.name, after.name],
        ['Description', before.description, after.description],
        ['Owner', before.ownerId, after.ownerId],
        ['Verification level', before.verificationLevel, after.verificationLevel],
        ['AFK channel', before.afkChannelId, after.afkChannelId],
        ['System channel', before.systemChannelId, after.systemChannelId],
        ['Language', before.preferredLocale, after.preferredLocale],
      ]),
      ...(before.icon !== after.icon ? ([['Icon', 'Changed']] as [string, string][]) : []),
      ...(before.banner !== after.banner ? ([['Banner', 'Changed']] as [string, string][]) : []),
    ];
    if (!fields.length) return;
    await emit(after, 'server_updated', async () => {
      const entry = await audit(after, [AuditLogEvent.GuildUpdate], () => true);
      return done(entry, { title: 'Server Updated', kind: 'update', fields });
    });
  },
});
