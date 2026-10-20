import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';
import { setAntibots, setAntilink } from './security.model';

function parseToggle(value: string | undefined): boolean | null {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'on') return true;
  if (normalized === 'off') return false;
  return null;
}

export const securityLogic = {
  async antibotsToggle(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const toggle = parseToggle(ctx.args[0]);
    if (toggle === null) return fail(ctx, `Say \`on\` or \`off\`.\nUse: \`${ctx.prefix}antibots <on|off>\`.`);
    await setAntibots(guild.id, toggle);
    await ctx.send(successReply(
      ctx,
      `- Anti-bot protection is now **${toggle ? 'enabled' : 'disabled'}**.\n- Bots that join without authorization will be ${toggle ? 'kicked automatically' : 'left alone'}.`,
    ));
    return 'completed';
  },

  async antilinkToggle(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const toggle = parseToggle(ctx.args[0]);
    if (toggle === null) return fail(ctx, `Say \`on\` or \`off\`.\nUse: \`${ctx.prefix}antilink <on|off>\`.`);
    await setAntilink(guild.id, toggle);
    await ctx.send(successReply(
      ctx,
      `- Anti-invite-link protection is now **${toggle ? 'enabled' : 'disabled'}**.\n- Discord invite links posted by members without \`Manage Server\` will be ${toggle ? 'deleted automatically' : 'allowed'}.`,
    ));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
