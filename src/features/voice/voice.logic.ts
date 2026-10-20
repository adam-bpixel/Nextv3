import { ChannelType, GatewayOpcodes } from 'discord.js';
import config from '../../core/config';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';

export const voiceLogic = {
  async join(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channel = ctx.member?.voice.channel;
    if (!channel) return fail(ctx, config.messages.joinVoice);
    if (channel.type === ChannelType.GuildStageVoice || !channel.joinable) return fail(ctx, "I can't join that channel.");
    guild.shard.send({ op: GatewayOpcodes.VoiceStateUpdate, d: { guild_id: guild.id, channel_id: channel.id, self_mute: false, self_deaf: true } });
    await ctx.send(successReply(ctx, `Joined **${channel.name}**.`));
    return 'completed';
  },

  async leave(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    if (!guild.members.me?.voice.channelId) return fail(ctx, "I'm not in a voice channel.");
    guild.shard.send({ op: GatewayOpcodes.VoiceStateUpdate, d: { guild_id: guild.id, channel_id: null, self_mute: false, self_deaf: false } });
    await ctx.send(successReply(ctx, 'Left the voice channel.'));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
