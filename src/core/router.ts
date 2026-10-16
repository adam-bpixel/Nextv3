import { MessageFlags, type BaseInteraction, type Interaction } from 'discord.js';
import { makeContext, slashArgs, type CommandInteraction } from './context';
import * as pipeline from './pipeline';
import { slashPath } from './slash';
import { defineRoute, type InteractionRoute } from './types';
import { asBotClient, type BotClient } from './client';

export const UNROUTED_MODAL_ACK = '✅ Received.';

export const commandRoute = defineRoute<CommandInteraction>({
  name: 'core:commands',
  match: (interaction): interaction is CommandInteraction => interaction.isChatInputCommand() || interaction.isContextMenuCommand(),
  async handle(interaction) {
    const command = asBotClient(interaction.client).slashCommands.get(slashPath(interaction));
    if (!command) return;
    const ctx = makeContext({ kind: 'command', interaction }, slashArgs(interaction, command.options));
    await pipeline.run(ctx, command);
  },
});

const reportedOverlaps = new Set<string>();

function routingKey(interaction: Interaction): string {
  return 'customId' in interaction ? `customId:${interaction.customId}` : `type:${interaction.type}`;
}

function warnOverlap(interaction: Interaction, routes: readonly InteractionRoute[]): void {
  const key = routingKey(interaction);
  if (reportedOverlaps.has(key)) return;
  reportedOverlaps.add(key);
  console.warn(`Routing: ${key} matches ${routes.map((route) => route.name).join(', ')}; using ${routes[0]?.name ?? 'none'}`);
}

export function matchingRoutes(routes: readonly InteractionRoute[], interaction: BaseInteraction): InteractionRoute[] {
  return routes.filter((route) => route.match(interaction));
}

async function acknowledgeUnrouted(interaction: Interaction): Promise<void> {
  if (interaction.isMessageComponent()) await interaction.deferUpdate();
  else if (interaction.isModalSubmit()) await interaction.reply({ content: UNROUTED_MODAL_ACK, flags: MessageFlags.Ephemeral });
}

export async function routeInteraction(client: BotClient, interaction: Interaction): Promise<void> {
  try {
    const matching = matchingRoutes([commandRoute, ...client.routes], interaction);
    if (matching.length > 1) warnOverlap(interaction, matching);
    const [route] = matching;
    if (route) await route.handle(interaction);
    else await acknowledgeUnrouted(interaction);
  } catch (error) {
    console.error('Interaction failed:', error);
  }
}
