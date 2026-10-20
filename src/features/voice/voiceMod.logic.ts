import { isDuration, parseDuration } from '../../core/format';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import * as ui from '../moderation/moderation.ui';
import { hasMoveAccess } from '../roles/roles.logic';
import { fetchVoiceLogs, resolveVoiceChannel } from './voiceMod.service';

const MOVE_PERMISSION_ERROR = "You need Move Members permission or the configured move role to use this command.";

const DEFAULT_VMUTE_MS = 10 * 60 * 1000;
const reasonFrom = (args: readonly string[], start: number): string | undefined => args.slice(start).join(' ') || undefined;

export const voiceModLogic = {
  async move(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    if (!(await hasMoveAccess(ctx))) { await ctx.send(errorReply(ctx, MOVE_PERMISSION_ERROR)); return 'skipped'; }
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the member to move.\nUse: \`${ctx.prefix}move <member> [voice channel]\`.`);
    const destination = resolveVoiceChannel(guild, ctx.args[1]) ?? ctx.member?.voice.channel ?? null;
    if (!destination) return fail(ctx, 'Mention a voice channel, or join one yourself first.');
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    await member.voice.setChannel(destination).catch(() => undefined);
    await ctx.send(successReply(ctx, `- Moved **${member.user.username}** to **${destination.name}**.`));
    return 'completed';
  },

  async fmove(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    if (!(await hasMoveAccess(ctx))) { await ctx.send(errorReply(ctx, MOVE_PERMISSION_ERROR)); return 'skipped'; }
    const member = await ctx.targetMember(0);
    const destination = resolveVoiceChannel(guild, ctx.args[1]);
    if (!member || !destination) return fail(ctx, `Mention the member and a voice channel.\nUse: \`${ctx.prefix}fmove <member> <voice channel>\`.`);
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    await member.voice.setChannel(destination).catch(() => undefined);
    await ctx.send(successReply(ctx, `- Force-moved **${member.user.username}** to **${destination.name}**.`));
    return 'completed';
  },

  async moveall(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    if (!(await hasMoveAccess(ctx))) { await ctx.send(errorReply(ctx, MOVE_PERMISSION_ERROR)); return 'skipped'; }
    const from = resolveVoiceChannel(guild, ctx.args[0]);
    const to = resolveVoiceChannel(guild, ctx.args[1]);
    if (!from || !to) return fail(ctx, `Both channels must be voice-based.\nUse: \`${ctx.prefix}moveall <from voice channel> <to voice channel>\`.`);
    const members = [...from.members.values()];
    let moved = 0;
    for (const member of members) {
      const ok = await member.voice.setChannel(to).then(
        () => true,
        () => false,
      );
      if (ok) moved++;
    }
    await ctx.send(successReply(ctx, `- Moved **${moved}/${members.length}** member(s) from **${from.name}** to **${to.name}**.`));
    return 'completed';
  },

  async vclist(ctx) {
    if (!(await requireGuild(ctx))) return 'skipped';
    const channel = ctx.member?.voice.channel;
    if (!channel) return fail(ctx, "You're not in a voice channel.");
    const members = [...channel.members.values()];
    const lines = members.map((member) => `• ${member.user.username} (${member.id})`);
    await ctx.send(ctx.embed({ title: `${channel.name} (${members.length} members)`, description: lines.join('\n') || 'No members currently in this channel.' }));
    return 'completed';
  },

  async vdeafen(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the member to deafen.\nUse: \`${ctx.prefix}vdeafen <member>\`.`);
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    await member.voice.setDeaf(true).catch(() => undefined);
    await ctx.send(successReply(ctx, `- Voice deafened **${member.user.username}**.`));
    return 'completed';
  },

  async vundeafen(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the member to undeafen.\nUse: \`${ctx.prefix}vundeafen <member>\`.`);
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    await member.voice.setDeaf(false).catch(() => undefined);
    await ctx.send(successReply(ctx, `- Removed voice deafen from **${member.user.username}**.`));
    return 'completed';
  },

  async vmute(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) {
      return fail(ctx, `Mention the member, a duration and a reason.\nUse: \`${ctx.prefix}vmute <user> <duration> <reason>\` (e.g. \`1h being loud\`).`);
    }
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    const durationArg = ctx.args[1];
    const durationMs = isDuration(durationArg) ? parseDuration(durationArg, DEFAULT_VMUTE_MS) : DEFAULT_VMUTE_MS;
    const reason = reasonFrom(ctx.args, isDuration(durationArg) ? 2 : 1);
    await member.voice.setMute(true, reason).catch(() => undefined);
    setTimeout(() => void member.voice.setMute(false).catch(() => undefined), durationMs);
    await ctx.send(successReply(ctx, `- Server muted **${member.user.username}** in voice for **${Math.round(durationMs / 60000)}m**.${reason ? `\n- Reason: ${reason}` : ''}`));
    return 'completed';
  },

  async vunmute(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the member to unmute.\nUse: \`${ctx.prefix}vunmute <member>\`.`);
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    await member.voice.setMute(false).catch(() => undefined);
    await ctx.send(successReply(ctx, `- Removed the voice mute from **${member.user.username}**.`));
    return 'completed';
  },

  async vkick(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}vkick <user mention or ID> [reason]\`.`);
    if (!member.voice.channelId) return fail(ctx, `**${member.user.username}** is not in a voice channel.`);
    const reason = reasonFrom(ctx.args, 1);
    await member.voice.disconnect(reason).catch(() => undefined);
    await ctx.send(successReply(ctx, `- Disconnected **${member.user.username}** from voice.${reason ? `\n- Reason: ${reason}` : ''}`));
    return 'completed';
  },

  async voiceclean(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const channel = resolveVoiceChannel(guild, ctx.args[0]) ?? ctx.member?.voice.channel ?? null;
    if (!channel) return fail(ctx, 'Mention a voice channel, or join one yourself first.');
    const members = [...channel.members.values()];
    let disconnected = 0;
    for (const member of members) {
      const ok = await member.voice.disconnect().then(
        () => true,
        () => false,
      );
      if (ok) disconnected++;
    }
    await ctx.send(successReply(ctx, `- Disconnected **${disconnected}/${members.length}** member(s) from **${channel.name}**.`));
    return 'completed';
  },

  async voicelogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = await ctx.findUser(0);
    if (!target) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}voicelogs <user mention or ID>\`.`);
    await ctx.send(ctx.embed(ui.auditLogEmbed('Voice Logs', target.username, await fetchVoiceLogs(guild, target.id))));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
