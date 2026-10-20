import { Events } from 'discord.js';
import { defineEvent } from '../../core/types';
import { getGuildSecurity } from '../../features/security/security.model';

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (!member.user.bot) return;
    const settings = await getGuildSecurity(member.guild.id);
    if (!settings.antibots) return;
    if (!member.kickable) return;
    await member.kick('Anti-bot protection: unauthorized bot join').catch((error: unknown) => console.error('Antibots kick failed:', error));
  },
});
