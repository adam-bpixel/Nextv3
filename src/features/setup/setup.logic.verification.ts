import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { getVerificationSetup } from './setup.model';
import { verificationView } from './setup.ui.verification';
import { ephemeral } from './setup.logic.helpers';

export const setupVerificationLogic = {
  async setupVerificationPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getVerificationSetup(guild.id);
    await ctx.send(ephemeral(verificationView(setup)));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
