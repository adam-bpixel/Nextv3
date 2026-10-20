import { Events } from 'discord.js';
import { asBotClient } from '../core/client';
import { routeInteraction } from '../core/router';
import { defineEvent } from '../core/types';
import { isAssignedBot } from '../features/fleet/fleet.model';

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = asBotClient(interaction.client);
    if (!(await isAssignedBot(client.fleetId, interaction.guildId))) return;
    await routeInteraction(client, interaction);
  },
});
