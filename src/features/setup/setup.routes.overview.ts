import type { ButtonInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { rejectOtherUser } from './setup.routes.helpers';
import { SETUP_OVERVIEW_NAV_PREFIX, setupOverview } from './setup.ui.overview';

const SETUP_OVERVIEW_NAV_ID = new RegExp(`^${SETUP_OVERVIEW_NAV_PREFIX}(\\d{15,22}):(-?\\d+)$`);

export const overviewRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:overview:nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && SETUP_OVERVIEW_NAV_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = SETUP_OVERVIEW_NAV_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, ownerId, pageText] = parsed as unknown as [string, string, string];
      if (await rejectOtherUser(interaction, ownerId)) return;
      await interaction.update(setupOverview(ownerId, Number(pageText)));
    },
  }),
];
