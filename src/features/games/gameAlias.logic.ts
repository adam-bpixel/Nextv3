import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { getGameAlias, listGameAliases, removeGameAlias, removeGameAliasesByRole, setGameAlias } from './gameAlias.model';

const ROLE_REFERENCE = /^<@&(\d{15,22})>$|^(\d{15,22})$/;

function roleIdFrom(raw: string | undefined): string | null {
  const match = ROLE_REFERENCE.exec(raw ?? '');
  return match?.[1] ?? match?.[2] ?? null;
}

export const gameAliasLogic = {
  async addgame(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const roleId = roleIdFrom(ctx.args[0]);
    const alias = ctx.args[1]?.toLowerCase();
    if (!roleId || !alias) return fail(ctx, `Mention a role and give it an alias.\nUse: \`${ctx.prefix}addgame <role mention or ID> <alias>\`.`);
    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) return fail(ctx, `I couldn't find a role with ID \`${roleId}\` in this server.`);
    const existing = await getGameAlias(guild.id, alias);
    await setGameAlias(guild.id, alias, role.id, ctx.user.id);
    await ctx.send(successReply(ctx, existing
      ? `- Updated alias **${alias}** to ping ${role}.`
      : `- Added alias **${alias}** for ${role}.`));
    return 'completed';
  },

  async removegame(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const raw = ctx.args[0];
    if (!raw) return fail(ctx, `Give an alias or role.\nUse: \`${ctx.prefix}removegame <alias or role mention or ID>\`.`);
    const roleId = roleIdFrom(raw);
    if (roleId) {
      const removed = await removeGameAliasesByRole(guild.id, roleId);
      if (!removed.length) return fail(ctx, `No game aliases point to that role.`);
      await ctx.send(successReply(ctx, `- Removed ${removed.length} alias(es) for <@&${roleId}>: ${removed.map((entry) => `**${entry.alias}**`).join(', ')}.`));
      return 'completed';
    }
    const alias = raw.toLowerCase();
    if (!(await removeGameAlias(guild.id, alias))) return fail(ctx, `No game alias named **${alias}** is configured.`);
    await ctx.send(successReply(ctx, `- Removed the **${alias}** game alias.`));
    return 'completed';
  },

  async listgames(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const aliases = await listGameAliases(guild.id);
    if (!aliases.length) {
      await ctx.send(errorReply(ctx, 'No game aliases are configured in this server yet.'));
      return 'skipped';
    }
    const lines = aliases.map((entry) => `- **${entry.alias}** → <@&${entry.roleId}>`);
    await ctx.send(successReply(ctx, lines.join('\n')));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
