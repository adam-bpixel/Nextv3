import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, GlobalFonts, loadImage, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import config from '../../core/config';

const CANVAS_WIDTH = 1100;
const LIST_CARD_HEIGHT = 80;
const LIST_CARD_GAP = 12;
const MAX_LISTED = 10;
const ICON_TIMEOUT_MS = 4000;
const FONT_FAMILY = '"Patrick Hand", "Raleway", "Segoe UI", sans-serif';
const TITLE_FONT = `bold 32px ${FONT_FAMILY}`;
const ROW_NAME_FONT = `bold 26px ${FONT_FAMILY}`;
const ROW_META_FONT = `15px ${FONT_FAMILY}`;
const ROW_BADGE_FONT = `bold 22px ${FONT_FAMILY}`;
const ROW_SCORE_FONT = `bold 28px ${FONT_FAMILY}`;
const ROW_SCORE_LABEL_FONT = `12px ${FONT_FAMILY}`;

const FONT_FILES = [
  { file: 'Raleway.ttf', family: 'Raleway' },
  { file: 'PatrickHand-Regular.ttf', family: 'Patrick Hand' },
];

let fontsLoaded = false;

function loadFonts(): void {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const fontsDir = path.join(config.root, 'assets', 'fonts');
  for (const font of FONT_FILES) {
    const fullPath = path.join(fontsDir, font.file);
    if (fs.existsSync(fullPath)) GlobalFonts.registerFromPath(fullPath, font.family);
  }
}

function loadBackgrounds(): Promise<Image[]> {
  const dir = path.join(config.root, 'assets', 'images');
  if (!fs.existsSync(dir)) return Promise.resolve([]);
  const files = fs.readdirSync(dir).filter((file) => /\.(jpe?g|png)$/i.test(file)).sort();
  return Promise.all(files.map((file) => loadImage(fs.readFileSync(path.join(dir, file)))));
}

let backgroundsPromise: Promise<Image[]> | null = null;
let bgCounter = 0;

function getBackgrounds(): Promise<Image[]> {
  backgroundsPromise ??= loadBackgrounds();
  return backgroundsPromise;
}

function drawCoverImage(ctx: SKRSContext2D, image: Image, width: number, height: number): void {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  let renderWidth = width;
  let renderHeight = height;
  let renderX = 0;
  let renderY = 0;

  if (imageRatio > canvasRatio) {
    renderWidth = height * imageRatio;
    renderX = (width - renderWidth) / 2;
  } else {
    renderHeight = width / imageRatio;
    renderY = (height - renderHeight) / 2;
  }

  ctx.drawImage(image, renderX, renderY, renderWidth, renderHeight);
}

const ICON_CACHE_TTL_MS = 10 * 60 * 1000;
const iconCache = new Map<string, { promise: Promise<Image | null>; cachedAt: number }>();

async function loadIcon(url: string | null): Promise<Image | null> {
  if (!url) return null;
  const cached = iconCache.get(url);
  if (cached && Date.now() - cached.cachedAt < ICON_CACHE_TTL_MS) return cached.promise;
  const promise = Promise.race([loadImage(url).catch(() => null), new Promise<null>((resolve) => setTimeout(() => resolve(null), ICON_TIMEOUT_MS))]);
  iconCache.set(url, { promise, cachedAt: Date.now() });
  return promise;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function fillRoundedRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, radius: number, fillStyle: string | CanvasGradient): void {
  const safeRadius = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(w, 0), h, safeRadius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeCurrentPath(ctx: SKRSContext2D, strokeStyle: string, lineWidth: number): void {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawAvatar(ctx: SKRSContext2D, image: Image | null, name: string, x: number, y: number, radius: number, initialFont: string): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  if (image) {
    ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = initialFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name.charAt(0) || '?').toUpperCase(), x, y);
  }
  ctx.restore();
}

export interface TopEntry {
  id: string;
  name: string;
  iconURL: string | null;
  metaText: string;
  scoreText: string;
  scoreLabel: string;
  fields?: { label: string; value: string }[];
}

function drawListRow(ctx: SKRSContext2D, entry: TopEntry, icon: Image | null, rank: number, y: number): void {
  const x = 40;
  const w = CANVAS_WIDTH - 80;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, LIST_CARD_HEIGHT, 16);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  const rowGlass = ctx.createLinearGradient(x, y, x, y + LIST_CARD_HEIGHT);
  rowGlass.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  rowGlass.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  rowGlass.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = rowGlass;
  ctx.fill();
  ctx.restore();

  const badgeW = 75;
  const badgeH = 34;
  const badgeX = x + 16;
  const badgeY = y + LIST_CARD_HEIGHT / 2 - badgeH / 2;

  ctx.save();
  fillRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12, 'rgba(0, 0, 0, 0.45)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.2)', 1);
  ctx.fillStyle = '#ffffff';
  ctx.font = ROW_BADGE_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
  ctx.restore();

  const avatarX = badgeX + badgeW + 36;
  const avatarY = y + LIST_CARD_HEIGHT / 2;
  drawAvatar(ctx, icon, entry.name, avatarX, avatarY, 26, `bold 26px ${FONT_FAMILY}`);

  const textX = avatarX + 26 + 20;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.font = ROW_NAME_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(entry.name, 28), textX, avatarY - 14);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = ROW_META_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 5;
  ctx.fillText(entry.metaText, textX, avatarY + 14);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = ROW_SCORE_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(entry.scoreText, x + w - 35, avatarY - 10);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = ROW_SCORE_LABEL_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText(entry.scoreLabel, x + w - 35, avatarY + 14);
  ctx.restore();
}


export async function renderMyTopBanner(entry: TopEntry, rank: number, total: number): Promise<Buffer> {
  loadFonts();

  const height = 120;
  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const backgrounds = await getBackgrounds();
  const background = backgrounds.at(bgCounter++ % Math.max(backgrounds.length, 1));
  if (background) drawCoverImage(ctx, background, CANVAS_WIDTH, height);

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
  veil.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const cardX = 30;
  const cardY = 16;
  const cardW = CANVAS_WIDTH - 60;
  const cardH = height - 32;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  const rowGlass = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  rowGlass.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  rowGlass.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  rowGlass.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = rowGlass;
  ctx.fill();

  const isRankOne = rank === 1;
  const strokeStyle = isRankOne ? 'rgba(251, 191, 36, 0.75)' : 'rgba(255, 255, 255, 0.16)';
  strokeCurrentPath(ctx, strokeStyle, isRankOne ? 1.6 : 1.2);
  ctx.restore();

  const badgeW = 90;
  const badgeH = 38;
  const badgeX = cardX + 18;
  const badgeY = cardY + cardH / 2 - badgeH / 2;

  const badgeGradient = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
  let badgeStroke = 'rgba(255, 255, 255, 0.25)';
  let badgeTextColor = '#ffffff';

  if (rank === 1) {
    badgeGradient.addColorStop(0, 'rgba(234, 179, 8, 0.55)');
    badgeGradient.addColorStop(1, 'rgba(245, 158, 11, 0.85)');
    badgeStroke = '#f59e0b';
    badgeTextColor = '#fbbf24';
  } else if (rank === 2) {
    badgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    badgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
    badgeStroke = 'rgba(255, 255, 255, 0.65)';
    badgeTextColor = '#ffffff';
  } else if (rank === 3) {
    badgeGradient.addColorStop(0, 'rgba(180, 83, 9, 0.55)');
    badgeGradient.addColorStop(1, 'rgba(146, 64, 14, 0.85)');
    badgeStroke = '#b45309';
    badgeTextColor = '#fcd34d';
  } else {
    badgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    badgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  }

  ctx.save();
  fillRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12, badgeGradient);
  strokeCurrentPath(ctx, badgeStroke, 1.2);
  ctx.fillStyle = badgeTextColor;
  ctx.font = ROW_BADGE_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
  ctx.restore();

  const avatarRadius = 28;
  const avatarX = badgeX + badgeW + 40;
  const avatarY = cardY + cardH / 2;
  const icon = await loadIcon(entry.iconURL);
  drawAvatar(ctx, icon, entry.name, avatarX, avatarY, avatarRadius, `bold 26px ${FONT_FAMILY}`);

  const textX = avatarX + avatarRadius + 20;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.font = ROW_NAME_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(entry.name, 28), textX, avatarY - 14);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = ROW_META_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 5;
  ctx.fillText(`${entry.metaText}   •   Rank #${rank} of ${total}`, textX, avatarY + 14);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = ROW_SCORE_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(entry.scoreText, cardX + cardW - 35, avatarY - 10);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = ROW_SCORE_LABEL_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText(entry.scoreLabel, cardX + cardW - 35, avatarY + 14);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

export async function renderTopImage(title: string, entries: readonly TopEntry[], page = 0, pageSize = MAX_LISTED): Promise<Buffer> {
  loadFonts();

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * pageSize;
  const shown = entries.slice(start, start + pageSize);
  const startRank = start + 1;

  const height = 100 + shown.length * (LIST_CARD_HEIGHT + LIST_CARD_GAP) + 35;

  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const backgrounds = await getBackgrounds();
  const background = backgrounds.at(bgCounter++ % Math.max(backgrounds.length, 1));
  if (background) drawCoverImage(ctx, background, CANVAS_WIDTH, height);

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
  veil.addColorStop(0.35, 'rgba(0, 0, 0, 0.22)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const titleText = title.toUpperCase();
  ctx.font = TITLE_FONT;
  const titleWidth = ctx.measureText(titleText).width;
  const pillW = titleWidth + 48;
  const pillH = 40;
  const pillX = CANVAS_WIDTH / 2 - pillW / 2;
  const pillY = 48 - 25;

  ctx.save();
  fillRoundedRect(ctx, pillX, pillY, pillW, pillH, 20, 'rgba(0, 0, 0, 0.45)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.25)', 1.2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, CANVAS_WIDTH / 2, pillY + pillH / 2 + 1);
  ctx.restore();

  const currentY = 90;

  const icons = await Promise.all(shown.map((entry) => loadIcon(entry.iconURL)));

  shown.forEach((entry, index) => {
    const y = currentY + index * (LIST_CARD_HEIGHT + LIST_CARD_GAP);
    drawListRow(ctx, entry, icons.at(index) ?? null, startRank + index, y);
  });

  return canvas.toBuffer('image/png');
}
