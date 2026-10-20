import { AuditLogEvent, Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { audit, done, emit, mention, time, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    await emit(member.guild, 'member_joined', () => Promise.resolve({
      title: 'Member Joined',
      kind: 'create',
      actorLabel: 'Member',
      actor: mention(member.id),
      fields: [
        ['Account created', time(member.user.createdTimestamp)],
        ['Bot', yesNo(member.user.bot)],
        ['Members now', member.guild.memberCount],
      ],
    }));
    if (member.user.bot) {
      await emit(member.guild, 'bot_added', async () => {
        const entry = await audit(member.guild, [AuditLogEvent.BotAdd], (e) => e.targetId === member.id);
        return done(entry, { title: 'Bot Added', kind: 'create', fields: [['Bot', `${member.user.tag} \`${member.id}\``]] });
      });
    }
  },
});
