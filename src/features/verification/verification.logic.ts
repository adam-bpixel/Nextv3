import { fail, requireGuild } from '../../core/replies';
import type { Ctx } from '../../core/context';
import type { CommandHandler, CommandOutcome } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { getGuildSetup } from '../setup/setup.model';
import { getServerInviteURL } from '../setup/setup.ui.shared';
import { addVerificationLog, listVerificationLogs, type VerificationKind } from './verification.model';
import { verificationLogsEmbed, verifiedDmEmbed, verifiedLogEmbed } from './verification.ui';

function canVerify(ctx: Ctx, verificatorRoleIds: readonly string[] | undefined): boolean {
  if (ctx.hasPermission('manage_roles') || ctx.hasPermission('administrator')) return true;
  if (!verificatorRoleIds?.length) return false;
  return verificatorRoleIds.some((roleId) => ctx.member?.roles.cache.has(roleId) ?? false);
}

async function grant(ctx: Ctx, kind: VerificationKind): Promise<CommandOutcome> {
  const guild = await requireGuild(ctx);
  if (!guild) return 'skipped';
  const { verification: setup, jail } = await getGuildSetup(guild.id);
  if (!setup?.verifiedRoleId || !setup.verifiedFemaleRoleId) {
    await ctx.send(errorReply(ctx, 'The verification system is not configured yet.\nUse: `/setup` to configure it.'));
    return 'skipped';
  }
  if (!canVerify(ctx, setup.verificatorRoleIds)) return fail(ctx, "You don't have permission to verify members.");

  const member = await ctx.targetMember(0);
  if (!member) return fail(ctx, 'Mention who to verify, or give their ID.');

  const roleId = kind === 'male' ? setup.verifiedRoleId : setup.verifiedFemaleRoleId;
  const oppositeRoleId = kind === 'male' ? setup.verifiedFemaleRoleId : setup.verifiedRoleId;
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    await ctx.send(errorReply(ctx, 'The configured verification role no longer exists.\nUse: `/setup` to configure it again.'));
    return 'skipped';
  }

  if (jail?.jailedRoleId && member.roles.cache.has(jail.jailedRoleId)) return fail(ctx, `**${member.user.username}** is jailed — unjail them first.`);
  if (member.roles.cache.has(role.id)) return fail(ctx, `**${member.user.username}** is already verified as ${kind}.`);

  const added = await member.roles
    .add(role, `Verified as ${kind} by ${ctx.user.username}`)
    .then(() => true)
    .catch(() => false);
  if (!added) return fail(ctx, "Couldn't give that role — check my role position and permissions.");

  if (member.roles.cache.has(oppositeRoleId)) await member.roles.remove(oppositeRoleId).catch(() => undefined);
  if (setup.unverifiedRoleId && member.roles.cache.has(setup.unverifiedRoleId)) {
    await member.roles.remove(setup.unverifiedRoleId, `Verified as ${kind}`).catch(() => undefined);
  }

  await addVerificationLog(guild.id, member.id, { kind, by: ctx.user.id, at: Date.now() });
  const inviteURL = await getServerInviteURL(guild);
  await member.send(verifiedDmEmbed(kind, guild.name, role.id, inviteURL)).catch(() => undefined);

  const logChannel = setup.logsChannelId ? await guild.channels.fetch(setup.logsChannelId).catch(() => null) : null;
  if (logChannel?.isTextBased()) await logChannel.send({ embeds: [verifiedLogEmbed(kind, member, ctx.user.id, role.id)] }).catch(() => undefined);

  await ctx.send(successReply(ctx, `- Verified **${member.user.username}** as **${kind}**.\n- Role: <@&${role.id}>`));
  return 'completed';
}

export const verificationLogic = {
  async vb(ctx) {
    return grant(ctx, 'male');
  },

  async vg(ctx) {
    return grant(ctx, 'female');
  },

  async veriflogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const { verification: setup } = await getGuildSetup(guild.id);
    if (!canVerify(ctx, setup?.verificatorRoleIds)) return fail(ctx, "You don't have permission to view verification logs.");
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, 'Mention who to check, or give their ID.');
    const logs = await listVerificationLogs(guild.id, member.id);
    await ctx.send(ctx.embed(verificationLogsEmbed(member.user.username, logs)));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
