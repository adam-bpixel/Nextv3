import fs from 'node:fs';
import path from 'node:path';
import { GlobalFonts, loadImage, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import config from '../../../core/config';

export const CANVAS_WIDTH = 1100;
export const ICON_TIMEOUT_MS = 4000;

export const RANK_FONT_FAMILY = '"Patrick Hand", "Raleway", "Segoe UI", sans-serif';
export const GLASS_FONT_FAMILY = '"Raleway", "Segoe UI", sans-serif';

// Shared between the topma list rows and the "my server" banner row, which use identical typography.
export const ROW_NAME_FONT = 'bold 26px "Raleway", "Segoe UI", sans-serif';
export const ROW_META_FONT = '15px "Raleway", "Segoe UI", sans-serif';
export const ROW_BADGE_FONT = 'bold 22px "Raleway", "Segoe UI", sans-serif';
export const ROW_SCORE_FONT = 'bold 28px "Raleway", "Segoe UI", sans-serif';
export const ROW_SCORE_LABEL_FONT = '12px "Raleway", "Segoe UI", sans-serif';

const FONT_FILES = [
  { file: 'Raleway.ttf', family: 'Raleway' },
  { file: 'MetalGothic.ttf', family: 'MetalGothic' },
  { file: 'Blackletter.ttf', family: 'Blackletter' },
  { file: 'AprilFont.ttf', family: 'AprilFont' },
  { file: 'PatrickHand-Regular.ttf', family: 'Patrick Hand' },
];

let fontsLoaded = false;

export function loadFonts(): void {
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


export async function nextBackground(): Promise<Image | null> {
  const backgrounds = await getBackgrounds();
  return backgrounds.at(bgCounter++ % Math.max(backgrounds.length, 1)) ?? null;
}

export function drawCoverImage(ctx: SKRSContext2D, image: Image, width: number, height: number): void {
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

export async function loadIcon(url: string | null): Promise<Image | null> {
  if (!url) return null;
  const cached = iconCache.get(url);
  if (cached && Date.now() - cached.cachedAt < ICON_CACHE_TTL_MS) return cached.promise;
  const promise = Promise.race([loadImage(url).catch(() => null), new Promise<null>((resolve) => setTimeout(() => resolve(null), ICON_TIMEOUT_MS))]);
  iconCache.set(url, { promise, cachedAt: Date.now() });
  return promise;
}


export async function loadIconUncached(url: string | null): Promise<Image | null> {
  if (!url) return null;
  return Promise.race([loadImage(url).catch(() => null), new Promise<null>((resolve) => setTimeout(() => resolve(null), ICON_TIMEOUT_MS))]);
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export function fillRoundedRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, radius: number, fillStyle: string | CanvasGradient): void {
  // @napi-rs/canvas does not auto-clamp an oversized radius the way browsers do, so a thin
  // progress-bar fill (small w) can throw and silently abort the whole render.
  const safeRadius = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(w, 0), h, safeRadius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

export function strokeCurrentPath(ctx: SKRSContext2D, strokeStyle: string, lineWidth: number): void {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function drawAvatar(ctx: SKRSContext2D, image: Image | null, name: string, x: number, y: number, radius: number, initialFont: string): void {
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
    ctx.fillText((name.charAt(0) || 'S').toUpperCase(), x, y);
  }
  ctx.restore();
}
