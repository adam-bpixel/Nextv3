import config from '../../core/config';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { cachedColor } from '../theme/theme.model';
import { statsFor } from './invites.model';
import { inviteStatsCard } from './invites.ui';

export const invitesLogic = {
  async invites(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = (await ctx.targetMember(0)) ?? ctx.member;
    if (!target) return fail(ctx, 'Could not resolve that member.');

    const stats = await statsFor(guild.id, target.id);
    const accentColor = (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
    await ctx.send(inviteStatsCard(accentColor, {
      userId: target.id,
      name: target.displayName,
      avatarURL: target.displayAvatarURL({ size: 256 }),
      valid: stats.joins - stats.leaves,
      fake: stats.fake,
      left: stats.leaves,
    }));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
