import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { getGuildPrefix, getUserPrefix } from '../prefix/prefix.model';
import { prefixView } from './setup.ui.prefix';
import { canUseSelfPrefix, ephemeral } from './setup.logic.helpers';

export const setupPrefixLogic = {
  async setupPrefixPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const [guildPrefix, selfPrefix, canUseSelf] = await Promise.all([
      getGuildPrefix(guild.id),
      getUserPrefix(ctx.user.id),
      canUseSelfPrefix(ctx.user.id),
    ]);
    await ctx.send(ephemeral(prefixView(guildPrefix, selfPrefix, canUseSelf)));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
