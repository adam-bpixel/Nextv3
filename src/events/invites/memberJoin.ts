import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { matchUsedInvite } from '../../features/invites/inviteTracker';
import { recordJoin } from '../../features/invites/invites.model';

const FAKE_ACCOUNT_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;
    const { inviterId } = await matchUsedInvite(member.guild);
    const fake = Date.now() - member.user.createdTimestamp < FAKE_ACCOUNT_AGE_MS;
    await recordJoin({ guildId: member.guild.id, memberId: member.id, inviterId, fake, left: false, at: Date.now() });
  },
});
