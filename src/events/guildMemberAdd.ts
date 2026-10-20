import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { getGuildSetup } from '../features/setup/setup.model';
import { syncVoiceCountChannel } from '../features/voice/voiceCount.service';

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    await syncVoiceCountChannel(member.guild);
    if (member.user.bot) return;
    const setup = await getGuildSetup(member.guild.id);
    const roleIds = (setup.autoRoleIds ?? []).filter((roleId) => member.guild.roles.cache.has(roleId));
    if (!roleIds.length) return;
    await member.roles.add(roleIds).catch((error: unknown) => console.error('Auto role assignment failed:', error));
  },
});
