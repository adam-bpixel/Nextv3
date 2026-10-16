import type { StringSelectMenuInteraction } from 'discord.js';
import { asBotClient } from '../../core/client';
import { defineRoute } from '../../core/types';
import { HELP_SELECT_ID, helpCategory } from './help.ui';

export const routes = [
  defineRoute<StringSelectMenuInteraction>({
    name: 'help:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId === HELP_SELECT_ID,
    async handle(interaction) {
      const [value] = interaction.values;
      if (value === undefined) return;
      await interaction.reply(helpCategory(asBotClient(interaction.client), value));
    },
  }),
];
