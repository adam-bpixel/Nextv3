import { StickerFormatType } from 'discord.js';
import { fail } from '../../core/replies';
import type { CommandHandler, CommandOutcome } from '../../core/types';
import type { Ctx } from '../../core/context';
import * as ui from './checker.ui';
import { createZip, type ZipEntry } from './zip';
import { isConfigured, selfbotApiGet } from './selfbot';

const SERVER_ID = /^\d{15,22}$/;
const DOWNLOAD_CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_SOURCE_BYTES = 100 * 1024 * 1024;
const MAX_ASSETS = 250;

interface ExportAsset {
  id: string;
  name: string;
  url: string;
  extension: string;
}

interface SelfbotGuildData {
  id: string;
  name: string;
}

interface SelfbotEmojiData {
  id: string;
  name: string;
  animated?: boolean;
}

interface SelfbotStickerData {
  id: string;
  name: string;
  format_type: number;
  formatType?: number;
}

interface SelfbotSoundboardSoundData {
  sound_id: string;
  name: string;
}

interface SelfbotSoundboardResponse {
  items?: SelfbotSoundboardSoundData[];
}

type CloneAssetKind = 'emoji' | 'sticker' | 'soundboard';

async function fetchSelfbotAssets(serverId: string, kind: CloneAssetKind): Promise<{ guild: SelfbotGuildData; assets: ExportAsset[] }> {
  const guild = await selfbotApiGet<SelfbotGuildData>(`/guilds/${serverId}`);
  if (kind === 'emoji') {
    const emojis = await selfbotApiGet<SelfbotEmojiData[]>(`/guilds/${serverId}/emojis`);
    return {
      guild,
      assets: emojis.map((emoji) => ({
        id: emoji.id,
        name: emoji.name,
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}?size=1024`,
        extension: emoji.animated ? 'gif' : 'png',
      })),
    };
  }

  if (kind === 'sticker') {
    const stickers = await selfbotApiGet<SelfbotStickerData[]>(`/guilds/${serverId}/stickers`);
    return {
      guild,
      assets: stickers.map((sticker) => {
        const format = sticker.format_type ?? sticker.formatType ?? 1;
        const extension = format === 3 ? 'json' : format === 4 ? 'gif' : 'png';
        return { id: sticker.id, name: sticker.name, url: `https://media.discordapp.net/stickers/${sticker.id}.${extension}`, extension };
      }),
    };
  }

  const response = await selfbotApiGet<SelfbotSoundboardResponse>(`/guilds/${serverId}/soundboard-sounds`);
  const sounds = response.items ?? [];
  return {
    guild,
    assets: sounds.map((sound) => ({
      id: sound.sound_id,
      name: sound.name,
      url: `https://cdn.discordapp.com/soundboard-sounds/${sound.sound_id}`,
      extension: 'mp3',
    })),
  };
}

async function fetchBotGuild(ctx: Ctx, serverId: string) {
  const botGuild = ctx.client.guilds.cache.get(serverId) ?? await ctx.client.guilds.fetch(serverId).catch(() => null);
  return botGuild;
}

function safeName(name: string): string {
  return name.replace(/[\\/?%*:|"<>\x00-\x1f]/g, '_').slice(0, 80) || 'asset';
}

function archiveFileName(guildName: string, kind: CloneAssetKind): string {
  const safeGuildName = guildName.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').trim() || 'server';
  const suffix = kind === 'sticker' ? 'Stickers' : kind === 'emoji' ? 'Emojis' : 'Soundboard';
  return `server (${safeGuildName})_${suffix}.zip`;
}

async function downloadAssets(assets: readonly ExportAsset[]): Promise<ZipEntry[]> {
  const entries: ZipEntry[] = [];
  let sourceBytes = 0;

  for (let start = 0; start < assets.length; start += DOWNLOAD_CONCURRENCY) {
    const batch = assets.slice(start, start + DOWNLOAD_CONCURRENCY);
    const results = await Promise.all(batch.map(async (asset): Promise<ZipEntry | null> => {
      try {
        const response = await fetch(asset.url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        if (!response.ok) return null;
        const length = Number(response.headers.get('content-length'));
        if (Number.isFinite(length) && length > MAX_FILE_BYTES) return null;
        const data = Buffer.from(await response.arrayBuffer());
        if (!data.length || data.length > MAX_FILE_BYTES) return null;
        return { name: `${safeName(asset.name)}_${asset.id}.${asset.extension}`, data };
      } catch {
        return null;
      }
    }));

    for (const entry of results) {
      if (!entry) continue;
      if (sourceBytes + entry.data.length > MAX_SOURCE_BYTES) return entries;
      sourceBytes += entry.data.length;
      entries.push(entry);
    }
  }

  return entries;
}

function channelUploadLimit(ctx: Ctx): number {
  const channel = ctx.channel;
  if (channel && 'attachmentSizeLimit' in channel && typeof channel.attachmentSizeLimit === 'number') return channel.attachmentSizeLimit;
  return 10 * 1024 * 1024;
}

async function cloneAssets(ctx: Ctx, kind: CloneAssetKind): Promise<CommandOutcome> {
  const rawArg = ctx.args[0]?.replace(/[<@!&#>]/g, '').trim() ?? '';
  const serverId = rawArg || ctx.guild?.id;
  if (!serverId || !SERVER_ID.test(serverId)) {
    const commandName = kind === 'emoji' ? 'cloneemojis' : kind === 'sticker' ? 'clonestickers' : 'clonesoundboard';
    return fail(ctx, `Give a server ID, or run this command inside a server. Example: \`${ctx.prefix}${commandName} 123456789012345678\``);
  }

  const assetLabel = kind === 'emoji' ? 'custom emojis' : kind === 'sticker' ? 'custom stickers' : 'custom soundboard sounds';
  const noun = kind === 'emoji' ? 'emojis' : kind === 'sticker' ? 'stickers' : 'soundboard sounds';
  const title = kind === 'emoji' ? 'Emoji archive' : kind === 'sticker' ? 'Sticker archive' : 'Soundboard archive';
  const progress = await ctx.send(ui.cloneAssetsPage(`${title} in progress`, `Connecting to the server and preparing ${assetLabel}...`));

  try {
    const botGuild = await fetchBotGuild(ctx, serverId);
    let guild: SelfbotGuildData;
    let assets: ExportAsset[];

    if (botGuild) {
      guild = { id: botGuild.id, name: botGuild.name };
      if (kind === 'emoji') {
        assets = [...(await botGuild.emojis.fetch()).values()].map((emoji) => ({
          id: emoji.id,
          name: emoji.name ?? 'emoji',
          url: emoji.imageURL({ extension: emoji.animated ? 'gif' : 'png', size: 1024 }),
          extension: emoji.animated ? 'gif' : 'png',
        }));
      } else if (kind === 'sticker') {
        assets = [...(await botGuild.stickers.fetch()).values()].map((sticker) => ({
          id: sticker.id,
          name: sticker.name,
          url: sticker.url,
          extension: sticker.format === StickerFormatType.Lottie ? 'json' : sticker.format === StickerFormatType.GIF ? 'gif' : 'png',
        }));
      } else {
        assets = [...(await botGuild.soundboardSounds.fetch()).values()].map((sound) => ({
          id: sound.soundId,
          name: sound.name,
          url: sound.url,
          extension: 'mp3',
        }));
      }
    } else if (isConfigured()) {
      ({ guild, assets } = await fetchSelfbotAssets(serverId, kind));
    } else {
      const note = 'The bot is not in this server. Configure SELFBOT_TOKEN to use the direct selfbot API fallback.';
      await progress.edit(ui.cloneAssetsPage('Server unavailable', note));
      return 'completed';
    }

    await progress.edit(ui.cloneAssetsPage(`${title} in progress`, `Downloading and packaging ${assetLabel} from **${guild.name}**...`));

    if (assets.length === 0) {
      await progress.edit(ui.cloneAssetsPage(`No ${noun} found`, `Server **${guild.name}** has no ${assetLabel} to export.`));
      return 'completed';
    }

    const entries = await downloadAssets(assets.slice(0, MAX_ASSETS));
    if (entries.length === 0) {
      await progress.edit(ui.cloneAssetsPage('Export failed', `I couldn't download any ${assetLabel} from **${guild.name}**.`));
      return 'completed';
    }

    const archive = createZip(entries);
    const fileName = archiveFileName(guild.name, kind);
    const limit = channelUploadLimit(ctx);
    if (archive.length > limit) {
      const sizeMB = (archive.length / (1024 * 1024)).toFixed(2);
      const limitMB = (limit / (1024 * 1024)).toFixed(2);
      await progress.edit(ui.cloneAssetsPage('Archive exceeds upload limit', `Packaged **${entries.length}** ${assetLabel} from **${guild.name}** into a ${sizeMB} MB archive. This channel allows files up to ${limitMB} MB.`));
      return 'completed';
    }

    const size = archive.length > 1024 * 1024
      ? `${(archive.length / (1024 * 1024)).toFixed(2)} MB`
      : `${(archive.length / 1024).toFixed(1)} KB`;
    const page = ui.cloneAssetsPage(
      `${kind === 'emoji' ? 'Emojis' : kind === 'sticker' ? 'Stickers' : 'Soundboard sounds'} archived`,
      `- __Server:__ **${guild.name}** (\`${guild.id}\`)\n` +
        `- __Packaged:__ \`${entries.length} ${noun}\`\n` +
        `- __Archive size:__ \`${size}\`\n` +
        `- __File:__ \`${fileName}\``,
      fileName,
    );
    await progress.edit(ui.cloneAssetsPayload(page, fileName, archive));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await progress.edit(ui.cloneAssetsPage('Export failed', `Couldn't create the ${assetLabel} archive: ${message.slice(0, 300)}`)).catch(() => undefined);
  }

  return 'completed';
}

export const cloneEmojis: CommandHandler = (ctx) => cloneAssets(ctx, 'emoji');
export const cloneStickers: CommandHandler = (ctx) => cloneAssets(ctx, 'sticker');
export const cloneSoundboard: CommandHandler = (ctx) => cloneAssets(ctx, 'soundboard');
