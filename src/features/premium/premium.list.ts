import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, ThumbnailBuilder, type Client } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, numberEmoji } from '../../core/emojis';
import { sep, text, toPayload } from '../setup/setup.ui.shared';
import { cachedColor } from '../theme/theme.model';
import { listPremium, type PremiumEntry } from './premium.model';

export type PremiumKind = 'user' | 'server';

export const PREMIUM_LIST_PER_PAGE = 5;
export const PREMIUM_LIST_PAGE_ID = /^premium:list:(user|server):(\d{15,22}):(\d+)$/;
const DEFAULT_ICON = 'https://cdn.discordapp.com/embed/avatars/0.png';

export function premiumListCustomId(kind: PremiumKind, invokerId: string, page: number): string {
  return `premium:list:${kind}:${invokerId}:${page}`;
}

interface Described {
  entry: PremiumEntry;
  name: string;
  iconURL: string;
}

async function describe(client: Client, kind: PremiumKind, entry: PremiumEntry): Promise<Described> {
  if (kind === 'server') {
    const guild = client.guilds.cache.get(entry.id);
    return { entry, name: guild?.name ?? 'Unknown server', iconURL: guild?.iconURL({ size: 128 }) ?? DEFAULT_ICON };
  }
  const user = client.users.cache.get(entry.id) ?? (await client.users.fetch(entry.id).catch(() => null));
  return { entry, name: user?.username ?? 'Unknown user', iconURL: user?.displayAvatarURL({ size: 128 }) ?? DEFAULT_ICON };
}

function section(rank: number, item: Described): SectionBuilder {
  const lines = [
    `${numberEmoji(rank)} **${item.name}**`,
    `> **ID:** \`${item.entry.id}\``,
    `> **Expires:** <t:${Math.floor(item.entry.expiresAt / 1000)}:R>`,
    `> **Granted by:** <@${item.entry.grantedBy}>`,
  ].join('\n');
  return new SectionBuilder().addTextDisplayComponents(text(lines)).setThumbnailAccessory(new ThumbnailBuilder().setURL(item.iconURL));
}

export async function premiumListPayload(client: Client, kind: PremiumKind, page: number, invokerId: string, guildId: string | null): Promise<ReplyPayload> {
  const entries = await listPremium(kind);
  const totalPages = Math.max(1, Math.ceil(entries.length / PREMIUM_LIST_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * PREMIUM_LIST_PER_PAGE;
  const shown = await Promise.all(entries.slice(start, start + PREMIUM_LIST_PER_PAGE).map((entry) => describe(client, kind, entry)));

  const container = new ContainerBuilder()
    .setAccentColor((guildId ? cachedColor(guildId) : undefined) ?? config.color)
    .addTextDisplayComponents(text(`# Premium ${kind === 'server' ? 'Servers' : 'Users'}`))
    .addSeparatorComponents(sep());

  if (!shown.length) container.addTextDisplayComponents(text(`*No ${kind === 'server' ? 'servers' : 'users'} have an active Premium subscription.*`));
  else shown.forEach((item, index) => container.addSectionComponents(section(start + index + 1, item)));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(premiumListCustomId(kind, invokerId, safePage - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 0),
      new ButtonBuilder().setCustomId('premium:list:noop').setLabel(`${safePage + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(premiumListCustomId(kind, invokerId, safePage + 1)).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages - 1),
    ),
  );
  return toPayload(container);
}
