import { requireGuild } from '../../core/replies';
import type { CommandHandler, CommandOutcome } from '../../core/types';
import { setupOverview } from './setup.ui.overview';

export const setupOverviewLogic = {
  async setupStatus(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    await ctx.send(setupOverview(ctx.user.id));
    return 'completed';
  },

  async setupPrefix(ctx): Promise<CommandOutcome> {
    return setupOverviewLogic.setupStatus(ctx);
  },
} satisfies Record<string, CommandHandler>;
