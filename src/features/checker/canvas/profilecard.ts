import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage, type Canvas, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import config from '../../../core/config';
import { drawAvatar, drawCoverImage, fillRoundedRect, loadAvatar, loadFonts, loadIcon, loadIconUncached, nextBackground, RANK_FONT_FAMILY, strokeCurrentPath, truncate } from './shared';
import type { RankCardData } from './rankcard';

export interface ProfileServerTag {
  text: string;
  badgeURL: string | null;
}

export interface ProfileConnection {
  type: string;
}

export interface ProfileCardData extends RankCardData {
  handle: string;
  botName?: string | undefined;
  backgroundURL?: string | null | undefined;
  joinedAt: number | null;
  serverTag: ProfileServerTag | null;
  voiceRank: number;
  voiceTotal: number;
  wallet: number;
  bank: number;
  currency: string;
  badgeURLs: readonly string[];
  connections: readonly ProfileConnection[];
  commandsUsed: number;
}

const BADGE_ICON_SIZE = 22;
const BADGE_ICON_GAP = 6;
const BADGE_FRAME_PAD_X = 10;
const BADGE_FRAME_PAD_Y = 6;
const BADGE_FRAME_RADIUS = 12;
const MAX_BADGE_ICONS = 8;

const TAG_ICON_SIZE = 14;
const TAG_PAD_X = 8;
const TAG_ICON_GAP = 5;
// Same height as the badge frame (BADGE_ICON_SIZE + BADGE_FRAME_PAD_Y * 2) so an identical
// corner radius actually reads as the same roundedness on both pills.
const TAG_FRAME_HEIGHT = BADGE_ICON_SIZE + BADGE_FRAME_PAD_Y * 2;

function drawBadgeFrame(ctx: SKRSContext2D, icons: readonly Image[], x: number, y: number): void {
  if (icons.length === 0) return;
  const contentWidth = icons.length * BADGE_ICON_SIZE + (icons.length - 1) * BADGE_ICON_GAP;
  const frameW = contentWidth + BADGE_FRAME_PAD_X * 2;
  const frameH = BADGE_ICON_SIZE + BADGE_FRAME_PAD_Y * 2;
  fillRoundedRect(ctx, x, y, frameW, frameH, BADGE_FRAME_RADIUS, 'rgba(255, 255, 255, 0.08)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.2)', 1.2);
  let iconX = x + BADGE_FRAME_PAD_X;
  const iconY = y + BADGE_FRAME_PAD_Y;
  for (const icon of icons) {
    ctx.drawImage(icon, iconX, iconY, BADGE_ICON_SIZE, BADGE_ICON_SIZE);
    iconX += BADGE_ICON_SIZE + BADGE_ICON_GAP;
  }
}


function drawServerTagFrame(ctx: SKRSContext2D, icon: Image | null, text: string, x: number, centerY: number): number {
  const tagText = truncate(text, 6).toUpperCase();
  ctx.font = `bold 13px ${RANK_FONT_FAMILY}`;
  const textWidth = ctx.measureText(tagText).width;
  const iconPart = icon ? TAG_ICON_SIZE + TAG_ICON_GAP : 0;
  const frameW = TAG_PAD_X * 2 + iconPart + textWidth;
  const frameY = centerY - TAG_FRAME_HEIGHT / 2;

  fillRoundedRect(ctx, x, frameY, frameW, TAG_FRAME_HEIGHT, BADGE_FRAME_RADIUS, 'rgba(255, 255, 255, 0.1)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.24)', 1);

  let cursorX = x + TAG_PAD_X;
  if (icon) {
    ctx.drawImage(icon, cursorX, centerY - TAG_ICON_SIZE / 2, TAG_ICON_SIZE, TAG_ICON_SIZE);
    cursorX += TAG_ICON_SIZE + TAG_ICON_GAP;
  }

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(tagText, cursorX, centerY);
  ctx.restore();

  return frameW;
}

const CONNECTION_ICON_SIZE = 26;
const CONNECTION_TILE_GAP = 14;
const CONNECTION_ROW_GAP = 14;
export const MAX_CONNECTIONS_SHOWN = 10;

// Simple Icons' SVGs ship as an unfilled black silhouette (no baked-in brand color), so each
// logo gets tinted white at draw time rather than boxed in its own background tile.
const CONNECTION_ICON_SLUGS: Record<string, string> = {
  'amazon-music': 'amazonmusic',
  battlenet: 'battledotnet',
  bluesky: 'bluesky',
  bungie: 'bungie',
  crunchyroll: 'crunchyroll',
  ebay: 'ebay',
  epicgames: 'epicgames',
  facebook: 'facebook',
  github: 'github',
  instagram: 'instagram',
  leagueoflegends: 'leagueoflegends',
  mastodon: 'mastodon',
  paypal: 'paypal',
  playstation: 'playstation',
  reddit: 'reddit',
  riotgames: 'riotgames',
  roblox: 'roblox',
  skype: 'skype',
  soundcloud: 'soundcloud',
  spotify: 'spotify',
  steam: 'steam',
  tiktok: 'tiktok',
  twitch: 'twitch',
  twitter: 'x',
  xbox: 'xbox',
  youtube: 'youtube',
};

export function connectionIconURL(type: string): string | null {
  const slug = CONNECTION_ICON_SLUGS[type];
  return slug ? `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg` : null;
}


function tintIconWhite(icon: Image, size: number): Canvas {
  const tile = createCanvas(size, size);
  const tileCtx = tile.getContext('2d');
  tileCtx.drawImage(icon, 0, 0, size, size);
  tileCtx.globalCompositeOperation = 'source-in';
  tileCtx.fillStyle = '#ffffff';
  tileCtx.fillRect(0, 0, size, size);

  const pixels = tileCtx.getImageData(0, 0, size, size).data;
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if ((pixels[(y * size + x) * 4 + 3] ?? 0) <= 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return tile;

  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;
  const centered = createCanvas(size, size);
  centered.getContext('2d').drawImage(
    tile,
    minX,
    minY,
    boundsWidth,
    boundsHeight,
    (size - boundsWidth) / 2,
    (size - boundsHeight) / 2,
    boundsWidth,
    boundsHeight,
  );
  return centered;
}


function drawConnectionIcons(ctx: SKRSContext2D, icons: readonly Image[], x: number, y: number, maxWidth: number): void {
  const perRow = Math.max(1, Math.floor((maxWidth + CONNECTION_TILE_GAP) / (CONNECTION_ICON_SIZE + CONNECTION_TILE_GAP)));
  icons.forEach((icon, index) => {
    const row = Math.floor(index / perRow);
    const column = index % perRow;
    const iconsInRow = Math.min(perRow, icons.length - row * perRow);
    const rowWidth = iconsInRow * CONNECTION_ICON_SIZE + (iconsInRow - 1) * CONNECTION_TILE_GAP;
    const rowX = x + (maxWidth - rowWidth) / 2;
    const iconX = rowX + column * (CONNECTION_ICON_SIZE + CONNECTION_TILE_GAP);
    const iconY = y + row * (CONNECTION_ICON_SIZE + CONNECTION_ROW_GAP);
    ctx.drawImage(tintIconWhite(icon, CONNECTION_ICON_SIZE), iconX, iconY, CONNECTION_ICON_SIZE, CONNECTION_ICON_SIZE);
  });
}

const CONNECTIONS_FRAME_PAD = 14;
const CONNECTIONS_FRAME_RADIUS = 18;


function connectionsGridSize(count: number, maxWidth: number): { width: number; height: number } {
  const perRow = Math.max(1, Math.floor((maxWidth + CONNECTION_TILE_GAP) / (CONNECTION_ICON_SIZE + CONNECTION_TILE_GAP)));
  const columns = Math.min(count, perRow);
  const rows = Math.ceil(count / perRow);
  return {
    width: columns * CONNECTION_ICON_SIZE + (columns - 1) * CONNECTION_TILE_GAP,
    height: rows * CONNECTION_ICON_SIZE + (rows - 1) * CONNECTION_ROW_GAP,
  };
}


function drawConnectionsFrame(ctx: SKRSContext2D, icons: readonly Image[], x: number, y: number, maxWidth: number): void {
  if (icons.length === 0) return;
  const grid = connectionsGridSize(icons.length, maxWidth);
  const frameW = grid.width + CONNECTIONS_FRAME_PAD * 2;
  const frameH = grid.height + CONNECTIONS_FRAME_PAD * 2;

  ctx.save();
  fillRoundedRect(ctx, x, y, frameW, frameH, CONNECTIONS_FRAME_RADIUS, 'rgba(10, 12, 16, 0.5)');
  const glass = ctx.createLinearGradient(x, y, x, y + frameH);
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  glass.addColorStop(0.55, 'rgba(255, 255, 255, 0.04)');
  glass.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  fillRoundedRect(ctx, x, y, frameW, frameH, CONNECTIONS_FRAME_RADIUS, glass);
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.24)', 1.2);
  ctx.restore();

  drawConnectionIcons(ctx, icons, x + CONNECTIONS_FRAME_PAD, y + CONNECTIONS_FRAME_PAD, grid.width);
}

function membershipDuration(joinedAt: number): string {
  const days = Math.max(0, Math.floor((Date.now() - joinedAt) / 86_400_000));
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;
  if (years > 0) return `${years}y ${months}mo`;
  if (months > 0) return `${months}mo ${remainingDays}d`;
  return `${remainingDays}d`;
}

function drawMembershipFrame(ctx: SKRSContext2D, joinedAt: number | null, x: number, y: number, frameW: number, frameH: number): void {
  ctx.save();
  fillRoundedRect(ctx, x, y, frameW, frameH, 20, 'rgba(255, 255, 255, 0.075)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.16)', 1.2);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#aeb7c4';
  ctx.font = `bold 14px ${RANK_FONT_FAMILY}`;
  ctx.fillText('SERVER MEMBERSHIP', x + frameW / 2, y + 37);
  if (joinedAt === null) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 22px ${RANK_FONT_FAMILY}`;
    ctx.fillText('JOIN DATE UNKNOWN', x + frameW / 2, y + 76);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 19px ${RANK_FONT_FAMILY}`;
    const date = new Date(joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillText(`${date} • ${membershipDuration(joinedAt)}`, x + frameW / 2, y + 76, frameW - 30);
  }
  ctx.restore();
}

let profileStarsPromise: Promise<Image | null> | null = null;


function getProfileStars(): Promise<Image | null> {
  profileStarsPromise ??= (async () => {
    const file = path.join(config.root, 'assets', 'decorations', 'profile-stars.png');
    if (!fs.existsSync(file)) return null;
    return loadImage(fs.readFileSync(file)).catch(() => null);
  })();
  return profileStarsPromise;
}

export async function renderProfileCard(data: ProfileCardData): Promise<Buffer> {
  loadFonts();

  const size = 1000;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#090a0c';
  ctx.fillRect(0, 0, size, size);

  const background = data.backgroundURL ? await loadIcon(data.backgroundURL) : await nextBackground();
  if (background) drawCoverImage(ctx, background, size, size);

  const veil = ctx.createLinearGradient(0, 0, size, size);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.76)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, size, size);

  const cardX = 34;
  const cardY = 34;
  const cardW = size - 68;
  const cardH = size - 68;
  ctx.save();
  fillRoundedRect(ctx, cardX, cardY, cardW, cardH, 30, 'rgba(10, 12, 16, 0.66)');
  const glass = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  glass.addColorStop(0.55, 'rgba(255, 255, 255, 0.04)');
  glass.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  fillRoundedRect(ctx, cardX, cardY, cardW, cardH, 30, glass);
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.24)', 1.4);
  ctx.restore();

  const stars = await getProfileStars();
  if (stars) {
    const starsSize = 150;
    const starsPad = 26;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(stars, cardX + cardW - starsSize - starsPad, cardY + starsPad, starsSize, starsSize);
    ctx.restore();
  }

  const avatarX = 180;
  const avatarY = 215;
  const avatarRadius = 100;
  const [avatar, decoration, badgeIconsRaw, serverTagIcon, connectionIconsRaw] = await Promise.all([
    loadAvatar(data.avatarURL),
    loadIconUncached(data.avatarDecorationURL),
    Promise.all(data.badgeURLs.slice(0, MAX_BADGE_ICONS).map((url) => loadIcon(url))),
    data.serverTag?.badgeURL ? loadIcon(data.serverTag.badgeURL) : Promise.resolve(null),
    Promise.all(data.connections.slice(0, MAX_CONNECTIONS_SHOWN).map((connection) => loadIcon(connectionIconURL(connection.type)))),
  ]);
  const badgeIcons = badgeIconsRaw.filter((icon): icon is Image => icon !== null);
  const connectionIcons = connectionIconsRaw.filter((icon): icon is Image => icon !== null);
  drawAvatar(ctx, avatar, data.username, avatarX, avatarY, avatarRadius, `bold 64px ${RANK_FONT_FAMILY}`);
  if (decoration) {
    const decorationSize = (avatarRadius + 15) * 2;
    ctx.drawImage(decoration, avatarX - decorationSize / 2, avatarY - decorationSize / 2, decorationSize, decorationSize);
  } else {
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const textX = avatarX + avatarRadius + 40;
  const textMaxWidth = size - textX - 40;
  const nameY = avatarY - 28;
  const handleY = avatarY + 6;
  const badgeFrameY = avatarY + 30;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 38px ${RANK_FONT_FAMILY}`;
  const displayName = truncate(data.username, 22);
  ctx.fillText(displayName, textX, nameY, textMaxWidth);

  if (data.serverTag) {
    const nameWidth = Math.min(ctx.measureText(displayName).width, textMaxWidth);
    drawServerTagFrame(ctx, serverTagIcon, data.serverTag.text, textX + nameWidth + 10, nameY - 14);
  }

  ctx.fillStyle = '#9aa5b1';
  ctx.font = `18px ${RANK_FONT_FAMILY}`;
  ctx.fillText(truncate(data.handle, 32), textX, handleY, textMaxWidth);

  drawBadgeFrame(ctx, badgeIcons, textX, badgeFrameY);

  // Everything below flows directly off the avatar's bottom edge (its tallest element) so the
  // card never reserves blank space for a section — like connections — that may not render.
  const headerBottom = avatarY + avatarRadius;
  const sectionGap = 30;

  const statW = 350;
  const statH = 106;
  const statGap = 32;
  const profileContentOffset = 20;
  const leftX = 120;
  const rightX = leftX + statW + statGap;
  const statY = headerBottom + sectionGap + profileContentOffset;
  const stats: { label: string; value: string; x: number; y: number }[] = [
    { label: 'LEVEL', value: String(data.level), x: leftX, y: statY },
    { label: 'XP', value: `${data.xp.toLocaleString()} / ${data.xpToNext.toLocaleString()}`, x: rightX, y: statY },
  ];
  ctx.textAlign = 'center';
  stats.forEach(({ label, value, x, y }) => {
    fillRoundedRect(ctx, x, y, statW, statH, 20, 'rgba(255, 255, 255, 0.075)');
    strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.16)', 1.2);
    const centerX = x + statW / 2;
    ctx.fillStyle = '#aeb7c4';
    ctx.font = `bold 14px ${RANK_FONT_FAMILY}`;
    ctx.fillText(label, centerX, y + 37);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 25px ${RANK_FONT_FAMILY}`;
    ctx.fillText(truncate(value, 20), centerX, y + 76, statW - 48);
  });

  const walletBankY = statY + statH + 22;
  drawMembershipFrame(ctx, data.joinedAt, leftX, walletBankY, statW, statH);
  fillRoundedRect(ctx, rightX, walletBankY, statW, statH, 20, 'rgba(255, 255, 255, 0.075)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.16)', 1.2);
  const economyCenterX = rightX + statW / 2;
  const walletCenterX = rightX + statW * 0.27;
  const bankCenterX = rightX + statW * 0.73;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aeb7c4';
  ctx.font = `bold 12px ${RANK_FONT_FAMILY}`;
  ctx.fillText('ECONOMY', economyCenterX, walletBankY + 25);
  ctx.font = `bold 11px ${RANK_FONT_FAMILY}`;
  ctx.fillText('WALLET', walletCenterX, walletBankY + 49);
  ctx.fillText('BANK', bankCenterX, walletBankY + 49);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 17px ${RANK_FONT_FAMILY}`;
  ctx.fillText(truncate(`${data.wallet.toLocaleString()} ${data.currency}`, 15), walletCenterX, walletBankY + 75, statW * 0.48);
  ctx.fillText(truncate(`${data.bank.toLocaleString()} ${data.currency}`, 15), bankCenterX, walletBankY + 75, statW * 0.48);
  ctx.beginPath();
  ctx.moveTo(rightX + statW / 2, walletBankY + 42);
  ctx.lineTo(rightX + statW / 2, walletBankY + statH - 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const summaryY = walletBankY + statH + sectionGap;
  fillRoundedRect(ctx, leftX, summaryY, statW, statH, 20, 'rgba(255, 255, 255, 0.075)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.16)', 1.2);
  fillRoundedRect(ctx, rightX, summaryY, statW, statH, 20, 'rgba(255, 255, 255, 0.075)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.16)', 1.2);

  const metricCenterY = summaryY + 54;
  const chatCenterX = leftX + statW * 0.29;
  const voiceCenterX = leftX + statW * 0.71;
  ctx.fillStyle = '#aeb7c4';
  ctx.font = `bold 13px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('CHAT', chatCenterX, summaryY + 28);
  ctx.fillText('VOICE', voiceCenterX, summaryY + 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 22px ${RANK_FONT_FAMILY}`;
  ctx.fillText(`#${data.rank}`, chatCenterX, metricCenterY);
  ctx.fillText(`#${data.voiceRank}`, voiceCenterX, metricCenterY);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `11px ${RANK_FONT_FAMILY}`;
  ctx.fillText(`OF ${data.total} MEMBERS`, chatCenterX, summaryY + 82);
  ctx.fillText(`OF ${data.voiceTotal} MEMBERS`, voiceCenterX, summaryY + 82);

  const dividerX = leftX + statW / 2;
  ctx.beginPath();
  ctx.moveTo(dividerX, summaryY + 22);
  ctx.lineTo(dividerX, summaryY + statH - 22);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const commandsCenterX = rightX + statW / 2;
  ctx.fillStyle = '#aeb7c4';
  ctx.font = `bold 14px ${RANK_FONT_FAMILY}`;
  ctx.fillText('COMMANDS USED', commandsCenterX, summaryY + 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 25px ${RANK_FONT_FAMILY}`;
  ctx.fillText(data.commandsUsed.toLocaleString(), commandsCenterX, summaryY + 76);

  const barX = leftX;
  const barW = rightX + statW - leftX;
  const barH = 14;
  const barCenter = barX + barW / 2;
  const barY = summaryY + statH + sectionGap;
  fillRoundedRect(ctx, barX, barY, barW, barH, 7, 'rgba(255, 255, 255, 0.24)');
  const progress = data.xpToNext > 0 ? Math.max(0, Math.min(data.xp / data.xpToNext, 1)) : 0;
  if (progress > 0) fillRoundedRect(ctx, barX, barY, barW * progress, barH, 7, '#ffffff');
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `14px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('PROGRESS TO NEXT LEVEL', barCenter, barY + 43);
  ctx.textAlign = 'left';

  const connectionsY = barY + 43 + sectionGap;
  if (connectionIcons.length > 0) {
    const connectionsMaxWidth = barW;
    const grid = connectionsGridSize(connectionIcons.length, connectionsMaxWidth);
    const frameW = grid.width + CONNECTIONS_FRAME_PAD * 2;
    drawConnectionsFrame(ctx, connectionIcons, (size - frameW) / 2, connectionsY, connectionsMaxWidth);
  }

  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = '#d1d5db';
  ctx.font = `12px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.botName ?? config.botName, size / 2, cardY + cardH - 20, cardW - 160);
  ctx.font = `6px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText('PBC', size - 10, size - 10);
  ctx.restore();

  return canvas.toBuffer('image/png');
}
