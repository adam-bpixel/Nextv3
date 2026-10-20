import type { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { handleGameTag } from './gamefinder.logic';
import { GAMEFINDER_TAG_PREFIX, GAMEFINDER_TAG_SELECT_ID } from './gamefinder.model';

export const gameFinderPublicRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'gamefinder:tag:button',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(GAMEFINDER_TAG_PREFIX),
    async handle(interaction) {
      const gameId = interaction.customId.slice(GAMEFINDER_TAG_PREFIX.length);
      await handleGameTag(interaction, gameId);
    },
  }),

  defineRoute<StringSelectMenuInteraction>({
    name: 'gamefinder:tag:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId === GAMEFINDER_TAG_SELECT_ID,
    async handle(interaction) {
      const gameId = interaction.values[0];
      if (!gameId) return;
      await handleGameTag(interaction, gameId);
    },
  }),
];
