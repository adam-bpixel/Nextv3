import { AuditLogEvent, Events, type PermissionOverwriteManager } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit, yesNo } from '../../features/logs/logs.core';

function overwriteSignature(overwrites: PermissionOverwriteManager | undefined): string {
  return JSON.stringify([...(overwrites?.cache.values() ?? [])].map((o) => [o.id, String(o.allow.bitfield), String(o.deny.bitfield)]).sort());
}

export default defineEvent({
  name: Events.ChannelUpdate,
  async execute(before, after) {
    if (before.isDMBased() || after.isDMBased()) return;
    const fields = [
      ...changes([
        ['Name', before.name, after.name],
        ['Topic', 'topic' in before ? before.topic : undefined, 'topic' in after ? after.topic : undefined],
        ['NSFW', 'nsfw' in before ? yesNo(before.nsfw) : undefined, 'nsfw' in after ? yesNo(after.nsfw) : undefined],
        ['Category', before.parent?.name, after.parent?.name],
        ['Slowmode', 'rateLimitPerUser' in before ? before.rateLimitPerUser : undefined, 'rateLimitPerUser' in after ? after.rateLimitPerUser : undefined],
        ['Bitrate', 'bitrate' in before ? before.bitrate : undefined, 'bitrate' in after ? after.bitrate : undefined],
        ['User limit', 'userLimit' in before ? before.userLimit : undefined, 'userLimit' in after ? after.userLimit : undefined],
      ]),
      ...(overwriteSignature(before.permissionOverwrites) !== overwriteSignature(after.permissionOverwrites)
        ? [['Permissions', 'Permission overwrites changed'] as [string, string]]
        : []),
    ];
    if (!fields.length) return;
    await emit(after.guild, 'channel_updated', async () => {
      const entry = await audit(
        after.guild,
        [AuditLogEvent.ChannelUpdate, AuditLogEvent.ChannelOverwriteCreate, AuditLogEvent.ChannelOverwriteUpdate, AuditLogEvent.ChannelOverwriteDelete],
        (e) => e.targetId === after.id,
      );
      return done(entry, { title: 'Channel Updated', kind: 'update', fields: [['Channel', `<#${after.id}> \`${after.id}\``], ...fields] });
    });
  },
});
