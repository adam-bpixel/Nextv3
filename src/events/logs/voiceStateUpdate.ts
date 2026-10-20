import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { actorText, audit, emit, mention } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.VoiceStateUpdate,
  async execute(before, after) {
    const guild = after.guild;
    const member = after.member ?? before.member;
    if (!member || member.id === guild.client.user.id) return;
    const self = { actorLabel: 'Member', actor: mention(member.id) };

    if (!before.channelId && after.channelId) {
      await emit(guild, 'voice_joined', () => Promise.resolve({ title: 'Voice Joined', kind: 'create', ...self, fields: [['Channel', `<#${after.channelId}>`]] }));
    } else if (before.channelId && !after.channelId) {
      await emit(guild, 'voice_left', () => Promise.resolve({ title: 'Voice Left', kind: 'delete', ...self, fields: [['Channel', `<#${before.channelId}>`]] }));
    } else if (before.channelId !== after.channelId) {
      await emit(guild, 'voice_moved', async () => {
        const entry = await audit(guild, [AuditLogEvent.MemberMove], () => true);
        return {
          title: 'Voice Moved',
          kind: 'info',
          ...self,
          fields: [
            ['From', `<#${before.channelId}>`],
            ['To', `<#${after.channelId}>`],
            ...(entry ? ([['Moved by', actorText(entry)]] as const) : []),
          ],
        };
      });
    }

    for (const [prop, eventKey, label] of [
      ['serverMute', 'voice_server_mute', 'Server Muted'] as const,
      ['serverDeaf', 'voice_server_deaf', 'Server Deafened'] as const,
    ]) {
      if (before[prop] !== after[prop] && after.channelId) {
        await emit(guild, eventKey, async () => {
          const entry = await audit(guild, [AuditLogEvent.MemberUpdate], (e) => e.targetId === member.id);
          return {
            title: after[prop] ? label : label.replace('Server ', 'Server Un'),
            kind: after[prop] ? 'warn' : 'create',
            actor: entry ? actorText(entry) : 'Unknown',
            fields: [
              ['Member', mention(member.id)],
              ['Channel', `<#${after.channelId}>`],
            ],
          };
        });
      }
    }
  },
});
