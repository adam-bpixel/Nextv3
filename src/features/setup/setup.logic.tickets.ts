import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { getGuildSetup } from './setup.model';
import { applyCategoriesView } from './setup.ui.apply';
import { ticketCategoriesView } from './setup.ui.ticket';
import { ephemeral } from './setup.logic.helpers';

export const setupTicketsLogic = {
  async setupTicketPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    await ctx.send(ephemeral(ticketCategoriesView(setup.ticketCategories ?? [])));
    return 'completed';
  },

  async setupApplyPanel(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const setup = await getGuildSetup(guild.id);
    await ctx.send(ephemeral(applyCategoriesView(setup.applyCategories ?? [])));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
