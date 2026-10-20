import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit, mention, time } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildMemberUpdate,
  async execute(before, after) {
    const guild = after.guild;
    if (!before.partial) {
      const added = after.roles.cache.filter((role) => !before.roles.cache.has(role.id));
      const removed = before.roles.cache.filter((role) => !after.roles.cache.has(role.id));
      for (const [list, eventKey, title, kind] of [
        [added, 'role_given', 'Role Given', 'create'],
        [removed, 'role_removed', 'Role Removed', 'delete'],
      ] as const) {
        if (!list.size) continue;
        await emit(guild, eventKey, async () => {
          const entry = await audit(guild, [AuditLogEvent.MemberRoleUpdate], (e) => e.targetId === after.id);
          return done(entry, {
            title,
            kind,
            fields: [
              ['Member', mention(after.id)],
              ['Roles', list.map((role) => `<@&${role.id}>`).join(' ')],
            ],
          });
        });
      }
      if (before.nickname !== after.nickname) {
        await emit(guild, 'nickname_changed', async () => {
          const entry = await audit(guild, [AuditLogEvent.MemberUpdate], (e) => e.targetId === after.id);
          return done(entry, {
            title: 'Nickname Changed',
            kind: 'update',
            fields: [['Member', mention(after.id)], ...changes([['Nickname', before.nickname, after.nickname]])],
          });
        });
      }
    }
    if (before.communicationDisabledUntilTimestamp !== after.communicationDisabledUntilTimestamp) {
      const until = after.communicationDisabledUntilTimestamp;
      const isActive = Boolean(until && until > Date.now());
      await emit(guild, 'member_timeout', async () => {
        const entry = await audit(guild, [AuditLogEvent.MemberUpdate], (e) => e.targetId === after.id);
        return done(entry, {
          title: isActive ? 'Member Timeout' : 'Timeout Removed',
          kind: isActive ? 'warn' : 'create',
          fields: [
            ['Member', mention(after.id)],
            ['Until', isActive && until ? time(until) : null],
          ],
        });
      });
    }
  },
});
