import { fail, requireGuild } from '../../../core/replies';
import type { CommandHandler } from '../../../core/types';
import { successReply } from '../../../core/usage-replies';
import { clanInviteCard, clanPromoteCard } from '../clans.ui';
import { clanOf, rankOf, saveClan } from '../clans.model';
import { accentOf, assignRank, managedClan, memberArg } from './helpers';

export const clansMembershipLogic = {
  async clanAdd(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await managedClan(ctx, guild.id); if (!clan) return 'skipped';
    const rank = rankOf(clan, ctx.user.id);
    if (rank !== 'leader' && rank !== 'co-leader') return fail(ctx, 'Only the clan leader or co-leader can invite members.');
    const target = await memberArg(ctx); if (!target || target.user.bot) return fail(ctx, `Mention a user or give their ID (not a bot).\nUse: \`${ctx.prefix}adduser <user mention or ID>\`.`);
    if (target.id === ctx.user.id) return fail(ctx, "You can't invite yourself.");
    if (await clanOf(guild.id, target.id)) return fail(ctx, 'That user already belongs to a clan.');
    if (clan.memberIds.length + clan.coLeaderIds.length + 1 >= clan.memberLimit) return fail(ctx, 'This clan has reached its member limit.');
    const inviterName = ctx.member?.displayName ?? ctx.user.username;
    await ctx.send(clanInviteCard(accentOf(ctx), {
      clanId: clan.id, clanName: clan.name, targetId: target.id, inviterName, status: 'pending', createdAt: Date.now(),
    }));
    return 'completed';
  },

  async clanRemove(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await managedClan(ctx, guild.id); if (!clan) return 'skipped';
    const target = await memberArg(ctx); if (!target) return fail(ctx, `Mention a user or give their ID.\nUse: \`${ctx.prefix}removeuser <user mention or ID>\`.`);
    if (!clan.memberIds.includes(target.id) && !clan.coLeaderIds.includes(target.id)) return fail(ctx, 'That user is not a member of this clan.');
    const rank = rankOf(clan, ctx.user.id); if (rank !== 'leader' && rank !== 'co-leader') return fail(ctx, 'Only clan leaders can remove members.');
    if (rank === 'co-leader' && clan.coLeaderIds.includes(target.id)) return fail(ctx, 'Co-leaders cannot remove other co-leaders.');
    clan.memberIds = clan.memberIds.filter((id) => id !== target.id); clan.coLeaderIds = clan.coLeaderIds.filter((id) => id !== target.id); delete clan.hoursMs[target.id];
    await saveClan(clan); await assignRank(target, clan, null);
    await ctx.send(successReply(ctx, `- Removed <@${target.id}> from **${clan.name}**.`)); return 'completed';
  },

  async clanLeave(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await clanOf(guild.id, ctx.user.id); if (!clan) return fail(ctx, 'You are not in a clan.');
    if (clan.leaderId === ctx.user.id) return fail(ctx, `Leaders must transfer leadership first. Use: \`${ctx.prefix}switchleader <member mention or ID>\`.`);
    clan.memberIds = clan.memberIds.filter((id) => id !== ctx.user.id); clan.coLeaderIds = clan.coLeaderIds.filter((id) => id !== ctx.user.id); delete clan.hoursMs[ctx.user.id];
    await saveClan(clan); if (ctx.member) await assignRank(ctx.member, clan, null);
    await ctx.send(successReply(ctx, `- You left **${clan.name}**.`)); return 'completed';
  },

  async clanPromote(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await managedClan(ctx, guild.id); if (!clan) return 'skipped';
    if (clan.leaderId !== ctx.user.id) return fail(ctx, 'Only the clan leader can promote co-leaders.');
    const target = await memberArg(ctx); if (!target || !clan.memberIds.includes(target.id)) return fail(ctx, `Mention a member of this clan or give their ID.\nUse: \`${ctx.prefix}addcoleader <clan member mention or ID>\`.`);
    if (clan.coLeaderIds.length >= clan.coLeaderLimit) return fail(ctx, 'This clan reached its co-leader limit.');
    await ctx.send(clanPromoteCard(accentOf(ctx), {
      clanId: clan.id, clanName: clan.name, targetId: target.id, leaderId: ctx.user.id, status: 'pending', createdAt: Date.now(),
    }));
    return 'completed';
  },

  async clanDemote(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await clanOf(guild.id, ctx.user.id);
    if (!clan || clan.leaderId !== ctx.user.id) return fail(ctx, 'Only the clan leader can demote co-leaders.');
    const target = await memberArg(ctx);
    if (!target || !clan.coLeaderIds.includes(target.id)) return fail(ctx, `Mention a co-leader of this clan or give their ID.\nUse: \`${ctx.prefix}removecoleader <co-leader mention or ID>\`.`);
    clan.coLeaderIds = clan.coLeaderIds.filter((id) => id !== target.id); clan.memberIds.push(target.id);
    await saveClan(clan); await assignRank(target, clan, 'member');
    await ctx.send(successReply(ctx, `- <@${target.id}> is now a member of **${clan.name}**.`)); return 'completed';
  },

  async clanTransfer(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await clanOf(guild.id, ctx.user.id); if (!clan || clan.leaderId !== ctx.user.id) return fail(ctx, 'Only a clan leader can transfer leadership.');
    const target = await memberArg(ctx); if (!target || !clan.memberIds.includes(target.id) && !clan.coLeaderIds.includes(target.id)) return fail(ctx, `Mention a member of this clan or give their ID.\nUse: \`${ctx.prefix}switchleader <clan member mention or ID>\`.`);
    const oldLeader = ctx.member;
    const oldLeaderId = clan.leaderId;
    clan.memberIds = clan.memberIds.filter((id) => id !== target.id); clan.coLeaderIds = clan.coLeaderIds.filter((id) => id !== target.id);
    clan.leaderId = target.id;
    if (clan.coLeaderIds.length < clan.coLeaderLimit) clan.coLeaderIds.push(oldLeaderId); else clan.memberIds.push(oldLeaderId);
    await saveClan(clan); await assignRank(target, clan, 'leader'); if (oldLeader) await assignRank(oldLeader, clan, rankOf(clan, oldLeader.id));
    await ctx.send(successReply(ctx, `- <@${target.id}> is now the leader of **${clan.name}**.`)); return 'completed';
  },
} satisfies Record<string, CommandHandler>;
