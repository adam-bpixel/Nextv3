import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildRoleCreate,
  async execute(role) {
    await emit(role.guild, 'role_created', async () => {
      const entry = await audit(role.guild, [AuditLogEvent.RoleCreate], (e) => e.targetId === role.id);
      return done(entry, {
        title: 'Role Created',
        kind: 'create',
        fields: [
          ['Role', `<@&${role.id}> \`${role.id}\``],
          ['Name', role.name],
          ['Color', role.hexColor],
          ['Hoisted', yesNo(role.hoist)],
          ['Mentionable', yesNo(role.mentionable)],
        ],
      });
    });
  },
});
