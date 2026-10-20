import { fail, requireGuild } from '../../../core/replies';
import type { CommandHandler } from '../../../core/types';
import { clanInfoCard, clanWarningsCard, clansListCard } from '../clans.ui';
import { clanOf, getClan, listClans, rankOf, settingsOf } from '../clans.model';
import { accentOf, duration, isManager, manager } from './helpers';

export const clansViewLogic = {
  async clanInfo(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : await clanOf(guild.id, ctx.user.id);
    if (!clan) return fail(ctx, `You are not in a clan. Use: \`${ctx.prefix}clans\` to browse clans.`);
    const accentColor = clan.color ? Number.parseInt(clan.color.replace('#', ''), 16) : accentOf(ctx);
    await ctx.send(clanInfoCard(accentColor, {
      id: clan.id,
      name: clan.name,
      leaderId: clan.leaderId,
      coLeaderIds: clan.coLeaderIds,
      memberCount: clan.memberIds.length + clan.coLeaderIds.length + 1,
      memberLimit: clan.memberLimit,
      roleId: clan.roleId,
      voiceChannelId: clan.voiceChannelId,
      tag: clan.tag,
      tagPosition: clan.tagPosition,
      voiceActivity: duration(Object.values(clan.hoursMs).reduce((a, b) => a + b, 0)),
      warningsCount: clan.warnings.length,
      avatarUrl: clan.avatarUrl,
    }));
    return 'completed';
  },

  async clans(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!(await manager(ctx, guild.id))) return 'skipped';
    const clans = (await listClans(guild.id)).sort((a, b) => a.name.localeCompare(b.name));
    await ctx.send(clansListCard(accentOf(ctx), guild.name, clans.map((clan) => ({
      id: clan.id,
      name: clan.name,
      memberCount: clan.memberIds.length + clan.coLeaderIds.length + 1,
      memberLimit: clan.memberLimit,
      leaderId: clan.leaderId,
      roleId: clan.roleId,
      warningsCount: clan.warnings.length,
      avatarUrl: clan.avatarUrl,
    })), 0, ctx.user.id));
    return 'completed';
  },

  async clanWarnings(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : await clanOf(guild.id, ctx.user.id); if (!clan) return fail(ctx, 'Clan not found.');
    const rank = rankOf(clan, ctx.user.id); if (rank !== 'leader' && rank !== 'co-leader' && !(ctx.member && isManager(ctx.member, (await settingsOf(guild.id)).managerRoleIds))) return fail(ctx, 'Only clan leaders or managers can view warnings.');
    await ctx.send(clanWarningsCard(accentOf(ctx), clan.name, clan.warnings.map((warning) => ({ reason: warning.reason, byId: warning.by, at: warning.at }))));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
