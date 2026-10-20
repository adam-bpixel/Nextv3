import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit, mention, time } from '../../features/logs/logs.core';

const seenPrunes = new Set<string>();

export default defineEvent({
  name: Events.GuildMemberRemove,
  async execute(member) {
    await emit(member.guild, ['member_left', 'member_kicked', 'members_pruned'], async () => {
      const entry = await audit(
        member.guild,
        [AuditLogEvent.MemberKick, AuditLogEvent.MemberBanAdd, AuditLogEvent.MemberPrune],
        (e) => e.action === AuditLogEvent.MemberPrune || e.targetId === member.id,
      );
      if (entry?.action === AuditLogEvent.MemberBanAdd) return null;
      if (entry?.action === AuditLogEvent.MemberPrune) {
        if (seenPrunes.has(entry.id)) return null;
        seenPrunes.add(entry.id);
        setTimeout(() => seenPrunes.delete(entry.id), 60_000).unref();
        const pruneExtra = entry.extra as { removed: number; days: number };
        return done(entry, {
          event: 'members_pruned',
          title: 'Members Pruned',
          kind: 'delete',
          fields: [
            ['Members removed', pruneExtra.removed],
            ['Inactive for (days)', pruneExtra.days],
          ],
        });
      }
      const fields = [
        ['Member', `${member.user.tag} \`${member.id}\``],
        ['Joined', member.joinedTimestamp ? time(member.joinedTimestamp) : null],
        ['Members now', member.guild.memberCount],
      ] as const;
      if (entry) return done(entry, { event: 'member_kicked', title: 'Member Kicked', kind: 'delete', fields });
      return { event: 'member_left', title: 'Member Left', kind: 'delete', fields, actorLabel: 'Member', actor: mention(member.id) };
    });
  },
});
