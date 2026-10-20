import { createCanvas } from '@napi-rs/canvas';
import type { GuildVoiceSummary } from '../voiceActivity';
import {
  CANVAS_WIDTH,
  drawAvatar,
  drawCoverImage,
  fillRoundedRect,
  loadFonts,
  loadIcon,
  nextBackground,
  ROW_BADGE_FONT,
  ROW_META_FONT,
  ROW_NAME_FONT,
  ROW_SCORE_FONT,
  ROW_SCORE_LABEL_FONT,
  strokeCurrentPath,
  truncate,
} from './shared';

export async function renderMyServerBanner(
  entry: GuildVoiceSummary,
  rank: number,
  totalRanked: number,
): Promise<Buffer> {
  loadFonts();

  const height = 120;
  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const background = await nextBackground();
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
  drawAvatar(ctx, icon, entry.name, avatarX, avatarY, avatarRadius, 'bold 26px "Raleway", "Segoe UI", sans-serif');

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

  const rankSub = `Rank #${rank} of ${totalRanked}`;
  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = ROW_META_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 5;
  ctx.fillText(`👥 ${entry.total.toLocaleString()} Members   •   ${rankSub}`, textX, avatarY + 14);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = ROW_SCORE_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(entry.voice.toLocaleString(), cardX + cardW - 35, avatarY - 10);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = ROW_SCORE_LABEL_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText('VOICE SCORE', cardX + cardW - 35, avatarY + 14);
  ctx.restore();

  return canvas.toBuffer('image/png');
}
