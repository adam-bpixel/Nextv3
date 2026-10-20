import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, changes, done, emit, permissionChanges, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildRoleUpdate,
  async execute(before, after) {
    await emit(after.guild, 'role_updated', async () => {
      const fields = [
        ...changes([
          ['Name', before.name, after.name],
          ['Color', before.hexColor, after.hexColor],
          ['Hoisted', yesNo(before.hoist), yesNo(after.hoist)],
          ['Mentionable', yesNo(before.mentionable), yesNo(after.mentionable)],
        ]),
        ...(before.permissions.bitfield !== after.permissions.bitfield ? permissionChanges(before.permissions, after.permissions) : []),
      ];
      if (!fields.length) return null;
      const entry = await audit(after.guild, [AuditLogEvent.RoleUpdate], (e) => e.targetId === after.id);
      return done(entry, { title: 'Role Updated', kind: 'update', fields: [['Role', `<@&${after.id}> \`${after.id}\``], ...fields] });
    });
  },
});
