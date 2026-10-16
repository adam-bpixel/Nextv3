import { fail, requireGuild } from '../../core/replies';
import type { Ctx } from '../../core/context';
import type { CommandHandler, CommandOutcome } from '../../core/types';
import { getGuildSetup } from './setup.model';
import { CHANNEL_REFERENCE, ROLE_REFERENCE, extractId, finalizeJailSetup, finalizeVerificationSetup, finalizeWarnSetup } from './setup.resolve';
import { jailSavedCard, setupOverview, verificationSavedCard, warnSavedCard } from './setup.ui';

export const setupLogic = {
  async setupStatus(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await ctx.send(setupOverview(await getGuildSetup(guild.id)));
    return 'completed';
  },

  async jailSetup(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const jailerRoleId = extractId(ctx.args[0], ROLE_REFERENCE);
    const jailedRoleId = extractId(ctx.args[1], ROLE_REFERENCE);
    const logsChannelId = extractId(ctx.args[2], CHANNEL_REFERENCE);
    if (!jailerRoleId || !jailedRoleId || !logsChannelId) {
      return fail(ctx, 'Give the jailer role, the jailed role, and the jail logs channel.');
    }
    const result = await finalizeJailSetup(guild, jailerRoleId, jailedRoleId, logsChannelId);
    if ('error' in result) return fail(ctx, result.error);
    await ctx.send(jailSavedCard(result.data));
    return 'completed';
  },

  async verificationSetup(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const verifiedRoleId = extractId(ctx.args[0], ROLE_REFERENCE);
    const verifiedFemaleRoleId = extractId(ctx.args[1], ROLE_REFERENCE);
    const unverifiedRoleId = extractId(ctx.args[2], ROLE_REFERENCE);
    const verificatorRoleId = extractId(ctx.args[3], ROLE_REFERENCE);
    const logsChannelId = extractId(ctx.args[4], CHANNEL_REFERENCE);
    if (!verifiedRoleId || !verifiedFemaleRoleId || !unverifiedRoleId || !verificatorRoleId || !logsChannelId) {
      return fail(ctx, 'Give the verified role, verified female role, unverified role, verificator role, and the verification logs channel.');
    }
    const result = await finalizeVerificationSetup(guild, verifiedRoleId, verifiedFemaleRoleId, unverifiedRoleId, verificatorRoleId, logsChannelId);
    if ('error' in result) return fail(ctx, result.error);
    await ctx.send(verificationSavedCard(result.data));
    return 'completed';
  },

  async warnSetup(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const firstWarnRoleId = extractId(ctx.args[0], ROLE_REFERENCE);
    const secondWarnRoleId = extractId(ctx.args[1], ROLE_REFERENCE);
    const lastWarnRoleId = extractId(ctx.args[2], ROLE_REFERENCE);
    const warnerRoleId = extractId(ctx.args[3], ROLE_REFERENCE);
    const logsChannelId = extractId(ctx.args[4], CHANNEL_REFERENCE);
    if (!firstWarnRoleId || !secondWarnRoleId || !lastWarnRoleId || !warnerRoleId || !logsChannelId) {
      return fail(ctx, 'Give the first warn role, second warn role, last warn role, warner role, and the warn logs channel.');
    }
    const result = await finalizeWarnSetup(guild, firstWarnRoleId, secondWarnRoleId, lastWarnRoleId, warnerRoleId, logsChannelId);
    if ('error' in result) return fail(ctx, result.error);
    await ctx.send(warnSavedCard(result.data));
    return 'completed';
  },

  async setupPrefix(ctx): Promise<CommandOutcome> {
    const [section, ...rest] = ctx.args;
    const subCtx: Ctx = { ...ctx, args: rest, text: rest.join(' ') };
    switch ((section ?? '').toLowerCase()) {
      case '':
      case 'status':
        return setupLogic.setupStatus(subCtx);
      case 'jail':
        return setupLogic.jailSetup(subCtx);
      case 'verification':
        return setupLogic.verificationSetup(subCtx);
      case 'warn':
        return setupLogic.warnSetup(subCtx);
      default:
        return fail(ctx, `Unknown setup section "${section}". Use \`jail\`, \`verification\`, \`warn\`, or \`status\`.`);
    }
  },
} satisfies Record<string, CommandHandler>;
