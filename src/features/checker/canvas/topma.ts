import { createCanvas, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import type { GuildVoiceSummary } from '../voiceActivity';
import { CANVAS_WIDTH, drawAvatar, drawCoverImage, fillRoundedRect, loadFonts, loadIcon, nextBackground, strokeCurrentPath, truncate } from './shared';
import { ROW_BADGE_FONT, ROW_META_FONT, ROW_NAME_FONT, ROW_SCORE_FONT, ROW_SCORE_LABEL_FONT } from './shared';

const PODIUM_HEIGHT = 265;
const LIST_CARD_HEIGHT = 80;
const LIST_CARD_GAP = 12;
const MAX_LISTED = 10;
const TITLE_FONT = 'bold 32px "Raleway", "Segoe UI", sans-serif';
const NAME_FONT = 'bold 26px "Raleway", "Segoe UI", sans-serif';
const META_FONT = '13px "Raleway", "Segoe UI", sans-serif';
const SCORE_FONT = 'bold 20px "Raleway", "Segoe UI", sans-serif';
const BADGE_FONT = 'bold 13px "Raleway", "Segoe UI", sans-serif';

interface PodiumSpot {
  entry: GuildVoiceSummary | undefined;
  icon: Image | null;
  rank: 1 | 2 | 3;
  x: number;
  w: number;
}

function drawPodiumCard(ctx: SKRSContext2D, spot: PodiumSpot, top: number): void {
  const { entry, icon, rank } = spot;
  if (!entry) return;

  const x = spot.x;
  const y = rank === 1 ? top : top + 16;
  const w = spot.w;
  const h = rank === 1 ? PODIUM_HEIGHT : PODIUM_HEIGHT - 16;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  const glass = ctx.createLinearGradient(x, y, x, y + h);
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  glass.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  glass.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = glass;
  ctx.fill();
  strokeCurrentPath(ctx, rank === 1 ? 'rgba(251, 191, 36, 0.75)' : 'rgba(255, 255, 255, 0.18)', rank === 1 ? 2 : 1.2);
  ctx.restore();

  const avatarRadius = rank === 1 ? 50 : 42;
  const avatarX = x + w / 2;
  const avatarY = y + 68;
  drawAvatar(ctx, icon, entry.name, avatarX, avatarY, avatarRadius, 'bold 30px "Raleway", "Segoe UI", sans-serif');

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.font = NAME_FONT;
  ctx.textAlign = 'center';
  ctx.fillText(truncate(entry.name, 20), x + w / 2, y + 146);
  ctx.restore();

  ctx.save();
  ctx.font = META_FONT;
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 6;
  ctx.fillText(`\u{1F465} ${entry.total.toLocaleString()} Members`, x + w / 2, y + 172);
  ctx.restore();

  const scoreText = entry.voice.toLocaleString();
  ctx.font = SCORE_FONT;
  const scoreWidth = Math.max(85, ctx.measureText(scoreText).width + 30);
  const scoreX = x + w / 2 - scoreWidth / 2;
  const scoreY = y + 190;

  ctx.save();
  fillRoundedRect(ctx, scoreX, scoreY, scoreWidth, 30, 10, 'rgba(0, 0, 0, 0.55)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.25)', 1);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(scoreText, x + w / 2, scoreY + 16);
  ctx.restore();

  const badgeW = 86;
  const badgeH = 26;
  const badgeX = x + w - badgeW - 12;
  const badgeY = y + h - badgeH - 12;
  const badgeGradient = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
  let badgeStroke = '#b45309';
  let badgeText = '#fcd34d';
  if (rank === 1) {
    badgeGradient.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
    badgeGradient.addColorStop(1, 'rgba(245, 158, 11, 0.7)');
    badgeStroke = '#f59e0b';
    badgeText = '#fbbf24';
  } else if (rank === 2) {
    badgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    badgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
    badgeStroke = 'rgba(255, 255, 255, 0.5)';
    badgeText = '#ffffff';
  } else {
    badgeGradient.addColorStop(0, 'rgba(180, 83, 9, 0.45)');
    badgeGradient.addColorStop(1, 'rgba(146, 64, 14, 0.7)');
  }

  ctx.save();
  fillRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12, badgeGradient);
  strokeCurrentPath(ctx, badgeStroke, 1.4);
  ctx.fillStyle = badgeText;
  ctx.font = BADGE_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank} RANK`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
  ctx.restore();
}

function drawListRow(ctx: SKRSContext2D, entry: GuildVoiceSummary, icon: Image | null, rank: number, y: number): void {
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
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.12)', 1.2);
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
  drawAvatar(ctx, icon, entry.name, avatarX, avatarY, 26, 'bold 26px "Raleway", "Segoe UI", sans-serif');

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
  ctx.fillText(`\u{1F465} ${entry.total.toLocaleString()} Members`, textX, avatarY + 14);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = ROW_SCORE_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(entry.voice.toLocaleString(), x + w - 35, avatarY - 10);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = ROW_SCORE_LABEL_FONT;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText('VOICE SCORE', x + w - 35, avatarY + 14);
  ctx.restore();
}

export async function renderTopmaImage(
  entries: readonly GuildVoiceSummary[],
  page = 0,
  pageSize = MAX_LISTED,
): Promise<Buffer> {
  loadFonts();

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * pageSize;
  const shown = entries.slice(start, start + pageSize);

  const isFirstPage = safePage === 0;
  const topThree = isFirstPage ? shown.slice(0, 3) : [];
  const rest = isFirstPage ? shown.slice(3) : shown;
  const restStartRank = isFirstPage ? 4 : start + 1;

  const height = 100 + (topThree.length ? PODIUM_HEIGHT + 20 : 0) + rest.length * (LIST_CARD_HEIGHT + LIST_CARD_GAP) + 35;

  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const background = await nextBackground();
  if (background) drawCoverImage(ctx, background, CANVAS_WIDTH, height);

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
  veil.addColorStop(0.35, 'rgba(0, 0, 0, 0.22)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const titleText = 'TOP SERVERS BY VOICE';
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

  let currentY = 90;

  const allIcons = await Promise.all(shown.map((entry) => loadIcon(entry.iconURL)));
  const topThreeIcons = isFirstPage ? allIcons.slice(0, 3) : [];
  const restIcons = isFirstPage ? allIcons.slice(3) : allIcons;

  if (topThree.length) {
    const podium: PodiumSpot[] = [
      { entry: topThree.at(1), icon: topThreeIcons.at(1) ?? null, rank: 2, x: 40, w: 325 },
      { entry: topThree.at(0), icon: topThreeIcons.at(0) ?? null, rank: 1, x: 385, w: 330 },
      { entry: topThree.at(2), icon: topThreeIcons.at(2) ?? null, rank: 3, x: 735, w: 325 },
    ];
    for (const spot of podium) drawPodiumCard(ctx, spot, currentY);
    currentY += PODIUM_HEIGHT + 20;
  }

  rest.forEach((entry, index) => {
    const y = currentY + index * (LIST_CARD_HEIGHT + LIST_CARD_GAP);
    drawListRow(ctx, entry, restIcons.at(index) ?? null, restStartRank + index, y);
  });

  return canvas.toBuffer('image/png');
}
