import type { Ctx } from '../../core/context';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { getJailSetup } from '../setup/setup.model';
import { addJailLog, getJailedMember, listJailLogs, removeJailedMember, setJailedMember } from './jail.model';
import { jailInfoEmbed, jailLogsEmbed } from './jail.ui';
import { notifyMember, reasonLines } from './moderation.dm';
import { NO_REASON } from './moderation.service';

const NOT_CONFIGURED_TEXT = 'The jail system is not fully set up.\nUse: `/setup` to configure the jailed role and jailer roles.';

const reasonFrom = (args: readonly string[], start: number): string => args.slice(start).join(' ') || NO_REASON;

function canJail(ctx: Ctx, jailerRoleIds: readonly string[]): boolean {
  if (ctx.hasPermission('moderate_members') || ctx.hasPermission('administrator')) return true;
  return jailerRoleIds.some((roleId) => ctx.member?.roles.cache.has(roleId) ?? false);
}

export const jailLogic = {
  async jail(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getJailSetup(guild.id);
    if (!setup.jailedRoleId) {
      await ctx.send(errorReply(ctx, NOT_CONFIGURED_TEXT));
      return 'skipped';
    }
    if (!canJail(ctx, setup.jailerRoleIds)) return fail(ctx, "You don't have permission to jail members.");

    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention who to jail, or give their ID.\nUse: \`${ctx.prefix}jail <user> [reason]\`.`);
    if (member.id === ctx.user.id) return fail(ctx, "You can't jail yourself.");
    if (member.id === guild.ownerId) return fail(ctx, "You can't jail the server owner.");
    if (await getJailedMember(guild.id, member.id)) return fail(ctx, `**${member.user.username}** is already jailed.`);

    const jailedRole = await guild.roles.fetch(setup.jailedRoleId).catch(() => null);
    if (!jailedRole || !jailedRole.editable) return fail(ctx, "I can't manage the jailed role — check my permissions and role position.");

    const reason = reasonFrom(ctx.args, 1);
    const previousRoleIds = member.roles.cache.filter((role) => role.id !== guild.id && role.editable).map((role) => role.id);

    const changed = await member.roles
      .set([jailedRole.id], `Jailed by ${ctx.user.username}: ${reason}`)
      .then(() => true)
      .catch(() => false);
    if (!changed) return fail(ctx, "I couldn't update that member's roles — check my permissions.");

    const at = Date.now();
    await setJailedMember(guild.id, member.id, { roleIds: previousRoleIds, reason, by: ctx.user.id, at });
    await addJailLog(guild.id, member.id, { action: 'jail', reason, by: ctx.user.id, at });

    const logChannel = setup.logsChannelId ? await guild.channels.fetch(setup.logsChannelId).catch(() => null) : null;
    if (logChannel?.isTextBased() && logChannel.isSendable()) {
      await logChannel.send({ content: `<@${member.id}> was jailed by <@${ctx.user.id}>.\nReason: ${reason}`, allowedMentions: { parse: [] } }).catch(() => undefined);
    }

    await notifyMember(member.user, 'You Were Jailed', [`Server: \`${guild.name}\``, ...reasonLines(reason), `By: \`${ctx.user.username}\``]);
    await ctx.send(successReply(ctx, `- Jailed **${member.user.username}**.\n- Reason: ${reason}`));
    return 'completed';
  },

  async unjail(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getJailSetup(guild.id);
    if (!setup.jailedRoleId) {
      await ctx.send(errorReply(ctx, NOT_CONFIGURED_TEXT));
      return 'skipped';
    }
    if (!canJail(ctx, setup.jailerRoleIds)) return fail(ctx, "You don't have permission to unjail members.");

    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention who to unjail, or give their ID.\nUse: \`${ctx.prefix}unjail <user> [reason]\`.`);
    const jailed = await getJailedMember(guild.id, member.id);
    if (!jailed) return fail(ctx, `**${member.user.username}** isn't jailed.`);

    const reason = reasonFrom(ctx.args, 1);
    const restoreRoleIds = jailed.roleIds.filter((roleId) => guild.roles.cache.has(roleId));

    const changed = await member.roles
      .set(restoreRoleIds, `Unjailed by ${ctx.user.username}: ${reason}`)
      .then(() => true)
      .catch(() => false);
    if (!changed) return fail(ctx, "I couldn't update that member's roles — check my permissions.");

    await removeJailedMember(guild.id, member.id);
    const at = Date.now();
    await addJailLog(guild.id, member.id, { action: 'unjail', reason, by: ctx.user.id, at });

    const logChannel = setup.logsChannelId ? await guild.channels.fetch(setup.logsChannelId).catch(() => null) : null;
    if (logChannel?.isTextBased() && logChannel.isSendable()) {
      await logChannel.send({ content: `<@${member.id}> was unjailed by <@${ctx.user.id}>.\nReason: ${reason}`, allowedMentions: { parse: [] } }).catch(() => undefined);
    }

    await ctx.send(successReply(ctx, `- Unjailed **${member.user.username}** and restored their roles.`));
    return 'completed';
  },

  async jailinfo(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getJailSetup(guild.id);
    if (!setup.jailedRoleId) {
      await ctx.send(errorReply(ctx, NOT_CONFIGURED_TEXT));
      return 'skipped';
    }
    const target = await ctx.targetUser();
    const jailed = await getJailedMember(guild.id, target.id);
    await ctx.send(ctx.embed(jailInfoEmbed(target.username, jailed)));
    return 'completed';
  },

  async jaillogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getJailSetup(guild.id);
    if (!setup.jailedRoleId) {
      await ctx.send(errorReply(ctx, NOT_CONFIGURED_TEXT));
      return 'skipped';
    }
    const target = await ctx.targetUser();
    const logs = await listJailLogs(guild.id, target.id);
    await ctx.send(ctx.embed(jailLogsEmbed(target.username, logs)));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
