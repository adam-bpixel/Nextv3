import { ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import config from '../../core/config';
import type { Ctx, ReplyPayload } from '../../core/context';
import type { CommandHandler } from '../../core/types';
import { cachedColor } from '../theme/theme.model';

const INTERACTIONS = [
  { name: 'pat', verb: 'patted', gifCategory: 'pat' },
  { name: 'poke', verb: 'poked', gifCategory: 'poke' },
  { name: 'wave', verb: 'waved at', gifCategory: 'wave' },
  { name: 'highfive', verb: 'high-fived', gifCategory: 'highfive' },
  { name: 'fistbump', verb: 'fist-bumped', gifCategory: 'handshake' },
] as const;

type InteractionName = (typeof INTERACTIONS)[number]['name'];
type InteractionDef = (typeof INTERACTIONS)[number];

interface NekosBestResponse {
  results?: { url?: string }[];
}

async function fetchAnimeGif(category: string): Promise<string | null> {
  try {
    const response = await fetch(`https://nekos.best/api/v2/${category}`);
    if (!response.ok) return null;
    const data = (await response.json()) as NekosBestResponse;
    const url = data.results?.[0]?.url;
    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}

function interactionCard(ctx: Ctx, def: InteractionDef, receiverId: string, actor: string, gifUrl: string | null): ReplyPayload {
  const accent = (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`<@${receiverId}>, you have been ${def.verb} by ${actor}.`));
  if (gifUrl) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(gifUrl)));
  }
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

function buildHandler(def: InteractionDef): CommandHandler {
  return async (ctx) => {
    const target = await ctx.findUser(0);
    const noTarget = !target || target.id === ctx.user.id;
    const receiverId = noTarget ? ctx.user.id : target.id;
    const actor = noTarget ? (ctx.client.user ? `<@${ctx.client.user.id}>` : `**${config.botName}**`) : `<@${ctx.user.id}>`;
    const gifUrl = await fetchAnimeGif(def.gifCategory);
    await ctx.send(interactionCard(ctx, def, receiverId, actor, gifUrl));
    return 'completed';
  };
}

export const interactionsLogic = Object.fromEntries(
  INTERACTIONS.map((def) => [def.name, buildHandler(def)] as const),
) as Record<InteractionName, CommandHandler>;
