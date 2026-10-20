import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildRoleDelete,
  async execute(role) {
    await emit(role.guild, 'role_deleted', async () => {
      const entry = await audit(role.guild, [AuditLogEvent.RoleDelete], (e) => e.targetId === role.id);
      return done(entry, {
        title: 'Role Deleted',
        kind: 'delete',
        fields: [
          ['Role', `${role.name} \`${role.id}\``],
          ['Color', role.hexColor],
          ['Members', role.members.size],
        ],
      });
    });
  },
});
