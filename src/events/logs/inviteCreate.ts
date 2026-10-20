import { Events, Guild } from 'discord.js';
import { defineEvent } from '../../core/types';
import { emit, mention, time, yesNo } from '../../features/logs/logs.core';

export default defineEvent({
  name: Events.InviteCreate,
  async execute(invite) {
    if (!(invite.guild instanceof Guild)) return;
    await emit(invite.guild, 'invite_created', () => Promise.resolve({
      title: 'Invite Created',
      kind: 'create',
      actorLabel: 'Created by',
      actor: invite.inviter ? mention(invite.inviter.id) : 'Unknown',
      fields: [
        ['Code', invite.code],
        ['Channel', invite.channel ? `<#${invite.channel.id}>` : null],
        ['Max uses', invite.maxUses || 'Unlimited'],
        ['Expires', invite.expiresTimestamp ? time(invite.expiresTimestamp) : 'Never'],
        ['Temporary', yesNo(invite.temporary)],
      ],
    }));
  },
});
