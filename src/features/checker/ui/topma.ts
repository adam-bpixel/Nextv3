import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, type Message } from 'discord.js';
import config from '../../../core/config';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, TOPMA_ICON } from '../../../core/emojis';
import { renderMyServerBanner } from '../canvas/myserver';
import { renderTopmaImage } from '../canvas/topma';
import type { GuildVoiceSummary } from '../voiceActivity';
import { type CheckerPage, DEFAULT_THUMBNAIL, clampIndex, emptyPage, sep, text, toPage } from './shared';

export const TOPMA_MYSERVER_BUTTON_ID = 'checker:topma-myserver';
export const TOPMA_NAV_PREFIX = 'checker:tm';

const MAX_LEADERBOARD_ENTRIES = 10;
const SESSION_TTL_MS = 10 * 60 * 1000;
const URL_CACHE_TTL_MS = 2 * 60 * 1000;

export function topmaNavCustomId(invokerId: string, page: number): string {
  return `${TOPMA_NAV_PREFIX}:${invokerId}:${page}`;
}

export function topmaActionRow(invokerId: string, page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(topmaNavCustomId(invokerId, page - 1))
      .setEmoji(ARROW_LEFT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(topmaNavCustomId(invokerId, page + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(TOPMA_MYSERVER_BUTTON_ID)
      .setLabel('My Server')
      .setStyle(ButtonStyle.Secondary),
  );
}

class TopmaSession {
  public lastAccess = Date.now();
  private pages = new Map<number, Promise<Buffer>>();

  constructor(
    public readonly invokerId: string,
    public readonly entries: readonly GuildVoiceSummary[],
    public readonly totalPages: number,
  ) {}

  public getPage(page: number): Promise<Buffer> {
    this.lastAccess = Date.now();
    const safePage = clampIndex(page, this.totalPages);
    let pending = this.pages.get(safePage);
    if (!pending) {
      pending = renderTopmaImage(this.entries, safePage, MAX_LEADERBOARD_ENTRIES);
      this.pages.set(safePage, pending);
    }
    return pending;
  }

  public prefetch(pagesToFetch: number[]): void {
    this.lastAccess = Date.now();
    for (const p of pagesToFetch) {
      if (p >= 0 && p < this.totalPages && !this.pages.has(p)) {
        const pending = renderTopmaImage(this.entries, p, MAX_LEADERBOARD_ENTRIES);
        this.pages.set(p, pending);
        pending.catch((err) => {
          console.error(`Failed to prefetch topma page ${p}:`, err);
          this.pages.delete(p);
        });
      }
    }
  }
}

const TOPMA_SESSIONS = new Map<string, TopmaSession>();

interface TopmaUrlCacheEntry {
  url: string;
  cachedAt: number;
}

const TOPMA_URL_CACHE = new Map<string, Map<number, TopmaUrlCacheEntry>>();


function cleanupStaleState(): void {
  const now = Date.now();
  for (const [id, session] of TOPMA_SESSIONS.entries()) {
    if (now - session.lastAccess > SESSION_TTL_MS) TOPMA_SESSIONS.delete(id);
  }
  for (const [id, pages] of TOPMA_URL_CACHE.entries()) {
    for (const [page, entry] of pages.entries()) {
      if (now - entry.cachedAt > URL_CACHE_TTL_MS) pages.delete(page);
    }
    if (pages.size === 0) TOPMA_URL_CACHE.delete(id);
  }
}

function getOrCreateTopmaSession(
  invokerId: string,
  entries: readonly GuildVoiceSummary[],
  totalPages: number,
  forceNew = false,
): TopmaSession {
  cleanupStaleState();
  const key = invokerId || 'default';
  const existing = TOPMA_SESSIONS.get(key);
  if (forceNew || !existing) {
    const session = new TopmaSession(key, entries, totalPages);
    TOPMA_SESSIONS.set(key, session);
    return session;
  }
  return existing;
}

function getCachedTopmaUrl(invokerId: string, page: number): string | null {
  const key = invokerId || 'default';
  const userCache = TOPMA_URL_CACHE.get(key);
  const entry = userCache?.get(page);
  if (!userCache || !entry) return null;
  if (Date.now() - entry.cachedAt > URL_CACHE_TTL_MS) {
    userCache.delete(page);
    return null;
  }
  return entry.url;
}

function setCachedTopmaUrl(invokerId: string, page: number, url: string): void {
  const key = invokerId || 'default';
  let userCache = TOPMA_URL_CACHE.get(key);
  if (!userCache) {
    userCache = new Map();
    TOPMA_URL_CACHE.set(key, userCache);
  }
  userCache.set(page, { url, cachedAt: Date.now() });
}


export function cacheTopmaPageUrl(invokerId: string, page: number, message: Message): void {
  const fileName = `topma-${page + 1}.png`;
  const url = message.attachments.find((attachment) => attachment.name === fileName)?.url;
  if (url) setCachedTopmaUrl(invokerId, page, url);
}

export async function topVoicePage(
  entries: readonly GuildVoiceSummary[],
  page = 0,
  invokerId = '',
): Promise<CheckerPage & { page: number }> {
  const inVoice = entries.filter((entry) => entry.voice > 0);
  if (!inVoice.length) {
    return { ...emptyPage(`${TOPMA_ICON} __Top Servers__`, 'Nobody is in a voice channel right now.', DEFAULT_THUMBNAIL), page: 0 };
  }

  const totalPages = Math.max(1, Math.ceil(inVoice.length / MAX_LEADERBOARD_ENTRIES));
  const safePage = clampIndex(page, totalPages);
  const fileName = `topma-${safePage + 1}.png`;
  const cachedUrl = getCachedTopmaUrl(invokerId, safePage);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${TOPMA_ICON} __Top Servers__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`Page ${safePage + 1}/${totalPages}`))
    .addSeparatorComponents(sep())
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(cachedUrl ?? `attachment://${fileName}`)),
    )
    .addSeparatorComponents(sep())
    .addActionRowComponents(topmaActionRow(invokerId, safePage, totalPages));

  if (cachedUrl) {
    return { ...toPage(container), page: safePage };
  }

  let buffer: Buffer;
  if (safePage === 0) {
    const session = getOrCreateTopmaSession(invokerId, inVoice, totalPages, true);
    const promises: [Promise<Buffer>, Promise<Buffer | null>] = [
      session.getPage(0),
      totalPages > 1 ? session.getPage(1) : Promise.resolve(null),
    ];
    const [pageZeroBuf] = await Promise.all(promises);
    buffer = pageZeroBuf;

    if (totalPages > 2) {
      session.prefetch(Array.from({ length: totalPages - 2 }, (_, i) => i + 2));
    }
  } else {
    const session = getOrCreateTopmaSession(invokerId, inVoice, totalPages, false);
    buffer = await session.getPage(safePage);

    session.prefetch([safePage - 1, safePage + 1, safePage + 2]);
  }

  return { ...toPage(container), files: [{ attachment: buffer, name: fileName }], page: safePage };
}

export async function myServerBannerPage(
  entry: GuildVoiceSummary,
  rank: number,
  totalRanked: number,
): Promise<CheckerPage> {
  const fileName = 'myserver.png';
  const buffer = await renderMyServerBanner(entry, rank, totalRanked);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addSeparatorComponents(sep())
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)))
    .addSeparatorComponents(sep());

  return { ...toPage(container), files: [{ attachment: buffer, name: fileName }] };
}
