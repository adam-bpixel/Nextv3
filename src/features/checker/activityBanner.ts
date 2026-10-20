import { createCanvas, loadImage } from '@napi-rs/canvas';
import { GLASS_FONT_FAMILY, drawCoverImage, fillRoundedRect, loadFonts, strokeCurrentPath, truncate } from './canvas/shared';

export interface ActivityBannerData {
  imageUrl: string;
  title: string;
  subtitle: string;
  label: string;
  progress?: { start: number; end: number } | null;
}

const WIDTH = 1200;
const HEIGHT = 330;
// Spotify/game cover art can take a bit to fetch; too short a timeout here silently drops the
// whole banner and falls back to text-only output, which looks like the image feature broke.
const IMAGE_FETCH_TIMEOUT_MS = 4000;

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function renderActivityBanner(data: ActivityBannerData): Promise<Buffer | null> {
  loadFonts();

  const image = await new Promise<Awaited<ReturnType<typeof loadImage>> | null>((resolve) => {
    const timeout = setTimeout(() => resolve(null), IMAGE_FETCH_TIMEOUT_MS);
    loadImage(data.imageUrl).then(
      (loaded) => {
        clearTimeout(timeout);
        resolve(loaded);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
    );
  });
  if (!image) return null;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Blur the cover art itself for the backdrop, drawn oversized so the blur's edge falloff
  // lands outside the visible canvas instead of fading the corners to transparent.
  const BLUR_BLEED = 40;
  ctx.save();
  ctx.filter = 'blur(28px)';
  ctx.translate(-BLUR_BLEED, -BLUR_BLEED);
  drawCoverImage(ctx, image, WIDTH + BLUR_BLEED * 2, HEIGHT + BLUR_BLEED * 2);
  ctx.restore();

  const veil = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  veil.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(18, 18, WIDTH - 36, HEIGHT - 36, 24);
  ctx.clip();
  const glass = ctx.createLinearGradient(18, 18, 18, HEIGHT - 18);
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  glass.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  glass.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = glass;
  ctx.fillRect(18, 18, WIDTH - 36, HEIGHT - 36);

  // Frame the cover as a separate tile so it stands out from the dark card.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(38, 38, 254, 254, 19);
  ctx.clip();
  const scale = Math.max(254 / image.width, 254 / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, 38 + (254 - drawWidth) / 2, 38 + (254 - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();

  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.28)', 1.5);
  ctx.beginPath();
  ctx.roundRect(38, 38, 254, 254, 19);
  ctx.stroke();

  const textX = 338;
  const textWidth = WIDTH - textX - 76;

  ctx.font = `bold 13px ${GLASS_FONT_FAMILY}`;
  const labelText = truncate(data.label.toUpperCase(), 20);
  const labelWidth = Math.max(130, ctx.measureText(labelText).width + 32);
  fillRoundedRect(ctx, textX, 52, labelWidth, 34, 17, 'rgba(255, 255, 255, 0.08)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.25)', 1);
  ctx.fillStyle = '#e5e7eb';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(labelText, textX + 16, 74);

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.font = `bold 39px ${GLASS_FONT_FAMILY}`;
  ctx.fillText(truncate(data.title, 34), textX, 151);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#c4c8d0';
  ctx.font = `24px ${GLASS_FONT_FAMILY}`;
  ctx.fillText(truncate(data.subtitle || data.label, 40), textX, 194);

  if (data.progress !== undefined) {
    const progressX = textX;
    const progressY = 246;
    const progressWidth = textWidth;
    const progressHeight = 7;
    fillRoundedRect(ctx, progressX, progressY, progressWidth, progressHeight, 4, 'rgba(255, 255, 255, 0.2)');

    if (data.progress && data.progress.end > data.progress.start) {
      const duration = data.progress.end - data.progress.start;
      const elapsed = Math.min(Math.max(Date.now() - data.progress.start, 0), duration);
      const fraction = elapsed / duration;
      const filledWidth = progressWidth * fraction;
      if (filledWidth > 0) fillRoundedRect(ctx, progressX, progressY, filledWidth, progressHeight, 4, '#ffffff');
      ctx.beginPath();
      ctx.arc(progressX + filledWidth, progressY + progressHeight / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.fillStyle = '#c4c8d0';
      ctx.font = `14px ${GLASS_FONT_FAMILY}`;
      ctx.fillText(formatTime(elapsed), progressX, 276);
      const durationText = formatTime(duration);
      ctx.textAlign = 'right';
      ctx.fillText(durationText, progressX + progressWidth, 276);
      ctx.textAlign = 'left';
    } else if (data.progress === null) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `14px ${GLASS_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText('Progress unavailable', progressX + progressWidth, 276);
      ctx.textAlign = 'left';
    }
  }

  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.13)', 1);
  ctx.beginPath();
  ctx.roundRect(18.5, 18.5, WIDTH - 37, HEIGHT - 37, 23.5);
  ctx.stroke();
  ctx.restore();

  return canvas.toBuffer('image/png');
}
