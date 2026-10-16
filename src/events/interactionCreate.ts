import { Events } from 'discord.js';
import { asBotClient } from '../core/client';
import { routeInteraction } from '../core/router';
import { defineEvent } from '../core/types';

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    await routeInteraction(asBotClient(interaction.client), interaction);
  },
});
