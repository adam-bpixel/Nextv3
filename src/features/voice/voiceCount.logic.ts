import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';
import { getVoiceCountSetup, setVoiceCountSettings } from '../setup/setup.model';
import { syncVoiceCountChannel } from './voiceCount.service';
import { resolveChannel } from './voiceMod.service';

const USAGE = 'Usage: `{prefix}voicecount <on|off|channel> [channel mention or ID]`';

export const voiceCountLogic = {
  async voicecount(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const subcommand = (ctx.args[0] ?? '').toLowerCase();
    if (subcommand === 'on') {
      await setVoiceCountSettings(guild.id, { enabled: true });
      await ctx.send(successReply(ctx, '- Voice count system enabled.'));
      return 'completed';
    }
    if (subcommand === 'off') {
      await setVoiceCountSettings(guild.id, { enabled: false });
      await ctx.send(successReply(ctx, '- Voice count system disabled.'));
      return 'completed';
    }
    if (subcommand === 'channel') {
      const channel = resolveChannel(guild, ctx.args[1]);
      if (!channel) return fail(ctx, 'Mention a channel, or give its ID.\n' + USAGE.replace('{prefix}', ctx.prefix));
      await setVoiceCountSettings(guild.id, { channelId: channel.id });
      await syncVoiceCountChannel(guild);
      await ctx.send(successReply(ctx, `- Voice count channel set to **${channel.name}**.`));
      return 'completed';
    }
    const settings = await getVoiceCountSetup(guild.id);
    return fail(
      ctx,
      `${USAGE.replace('{prefix}', ctx.prefix)}\n\n**Commands:**\n• \`${ctx.prefix}voicecount on\` - Enable voice count system\n• \`${ctx.prefix}voicecount off\` - Disable voice count system\n• \`${ctx.prefix}voicecount channel <channel>\` - Set voice count channel (text or voice)\n\nCurrently **${settings.enabled ? 'enabled' : 'disabled'}**${settings.channelId ? ` in <#${settings.channelId}>` : ''}.`,
    );
  },
} satisfies Record<string, CommandHandler>;
