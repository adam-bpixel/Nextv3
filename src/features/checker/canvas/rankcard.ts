import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage, type Image, type SKRSContext2D } from '@napi-rs/canvas';
import config from '../../../core/config';
import { drawAvatar, drawCoverImage, fillRoundedRect, loadAvatar, loadFonts, loadIconUncached, RANK_FONT_FAMILY, strokeCurrentPath, truncate, CANVAS_WIDTH } from './shared';

export interface RankCardData {
  username: string;
  avatarURL: string;
  avatarDecorationURL: string | null;
  rank: number;
  total: number;
  level: number;
  xp: number;
  xpToNext: number;
}

export interface RankStat {
  level: number;
  xp: number;
  xpToNext: number;
  rank: number;
  total: number;
}

export interface DualRankCardData {
  username: string;
  avatarURL: string;
  avatarDecorationURL: string | null;
  chat: RankStat;
  voice: RankStat;
}

const STAT_BAR_OFFSET = 42;
const STAT_BAR_HEIGHT = 14;
const RANK_BADGE_WIDTH = 180;
const RANK_BADGE_HEIGHT = 76;

let rankBackgroundPromise: Promise<Image | null> | null = null;

function getRankBackground(): Promise<Image | null> {
  rankBackgroundPromise ??= (async () => {
    const file = path.join(config.root, 'assets', 'rank_background.png');
    if (!fs.existsSync(file)) return null;
    return loadImage(fs.readFileSync(file)).catch(() => null);
  })();
  return rankBackgroundPromise;
}


function statBarCenterY(topY: number): number {
  return topY + STAT_BAR_OFFSET + STAT_BAR_HEIGHT / 2;
}

function drawRankStatBlock(ctx: SKRSContext2D, stat: RankStat, label: string, x: number, width: number, topY: number): void {
  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `bold 20px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 6;
  ctx.fillText(`${label} • LEVEL ${stat.level}`, x, topY);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `16px ${RANK_FONT_FAMILY}`;
  ctx.fillText(`${stat.xp.toLocaleString()} / ${stat.xpToNext.toLocaleString()} XP`, x, topY + 28);
  ctx.restore();

  const barY = topY + STAT_BAR_OFFSET;
  fillRoundedRect(ctx, x, barY, width, STAT_BAR_HEIGHT, 7, 'rgba(255, 255, 255, 0.25)');
  const progress = stat.xpToNext > 0 ? Math.max(0, Math.min(stat.xp / stat.xpToNext, 1)) : 0;
  if (progress > 0) fillRoundedRect(ctx, x, barY, width * progress, STAT_BAR_HEIGHT, 7, '#ffffff');

  ctx.save();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `12px ${RANK_FONT_FAMILY}`;
  ctx.fillText('XP TO NEXT LEVEL', x, barY + 27);
  ctx.restore();
}


function drawRankBadge(ctx: SKRSContext2D, stat: RankStat, label: string, x: number, centerY: number): void {
  const w = RANK_BADGE_WIDTH;
  const h = RANK_BADGE_HEIGHT;
  const y = centerY - h / 2;
  ctx.save();
  fillRoundedRect(ctx, x, y, w, h, 18, 'rgba(0, 0, 0, 0.46)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.3)', 1.2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(`#${stat.rank}`, x + w / 2, y + 34);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `12px ${RANK_FONT_FAMILY}`;
  ctx.fillText(`${label} • OF ${stat.total}`, x + w / 2, y + 56);
  ctx.restore();
}

export async function renderRankCard(data: DualRankCardData): Promise<Buffer> {
  loadFonts();

  const height = 360;
  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#090a0c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const background = await getRankBackground();
  if (background) drawCoverImage(ctx, background, CANVAS_WIDTH, height);

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const cardX = 30;
  const cardY = 28;
  const cardW = CANVAS_WIDTH - 60;
  const cardH = height - 56;
  ctx.save();
  fillRoundedRect(ctx, cardX, cardY, cardW, cardH, 24, 'rgba(10, 12, 16, 0.68)');
  const glass = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  glass.addColorStop(0.55, 'rgba(255, 255, 255, 0.04)');
  glass.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  fillRoundedRect(ctx, cardX, cardY, cardW, cardH, 24, glass);
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.24)', 1.4);
  ctx.restore();

  const avatarX = 180;
  const avatarY = cardY + cardH / 2;
  const avatarRadius = 85;
  const [avatar, decoration] = await Promise.all([
    loadAvatar(data.avatarURL),
    loadIconUncached(data.avatarDecorationURL),
  ]);
  drawAvatar(ctx, avatar, data.username, avatarX, avatarY, avatarRadius, `bold 52px ${RANK_FONT_FAMILY}`);

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

  const textX = 330;
  const maxTextWidth = 480;
  const usernameY = 88;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 38px ${RANK_FONT_FAMILY}`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText(truncate(data.username, 28), textX, usernameY, maxTextWidth);
  ctx.restore();

  const chatBlockTop = 124;
  const voiceBlockTop = 231;
  drawRankStatBlock(ctx, data.chat, 'CHAT', textX, maxTextWidth, chatBlockTop);
  drawRankStatBlock(ctx, data.voice, 'VOICE', textX, maxTextWidth, voiceBlockTop);

  drawRankBadge(ctx, data.chat, 'CHAT', 850, statBarCenterY(chatBlockTop));
  drawRankBadge(ctx, data.voice, 'VOICE', 850, statBarCenterY(voiceBlockTop));

  return canvas.toBuffer('image/png');
}
