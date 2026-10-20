import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { CANVAS_WIDTH, drawAvatar, drawCoverImage, fillRoundedRect, loadFonts, loadIcon, nextBackground, RANK_FONT_FAMILY, strokeCurrentPath, truncate } from './shared';

export interface ServerStatsCardData {
  guildName: string;
  iconURL: string | null;
  memberCount: number;
  humanCount: number;
  botCount: number;
  voiceNow: number;
  textChannels: number;
  voiceChannels: number;
  roleCount: number;
  boostCount: number;
  boostTier: number;
}

const STATS_STAT_BOX_W = 250;
const STATS_STAT_BOX_H = 110;
const STATS_STAT_GAP = 20;
const STATS_COLUMNS = 4;

function drawServerStatBox(ctx: SKRSContext2D, label: string, value: string, x: number, y: number): void {
  ctx.save();
  fillRoundedRect(ctx, x, y, STATS_STAT_BOX_W, STATS_STAT_BOX_H, 20, 'rgba(255, 255, 255, 0.075)');
  strokeCurrentPath(ctx, 'rgba(255, 255, 255, 0.16)', 1.2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aeb7c4';
  ctx.font = `bold 14px ${RANK_FONT_FAMILY}`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 5;
  ctx.fillText(label, x + STATS_STAT_BOX_W / 2, y + 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 28px ${RANK_FONT_FAMILY}`;
  ctx.shadowBlur = 8;
  ctx.fillText(truncate(value, 16), x + STATS_STAT_BOX_W / 2, y + 74, STATS_STAT_BOX_W - 24);
  ctx.restore();
}

export async function renderServerStatsCard(data: ServerStatsCardData): Promise<Buffer> {
  loadFonts();

  const headerHeight = 170;
  const rows = Math.ceil(8 / STATS_COLUMNS);
  const gridWidth = STATS_COLUMNS * STATS_STAT_BOX_W + (STATS_COLUMNS - 1) * STATS_STAT_GAP;
  const gridHeight = rows * STATS_STAT_BOX_H + (rows - 1) * STATS_STAT_GAP;
  const height = headerHeight + gridHeight + 50;

  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const background = await nextBackground();
  if (background) drawCoverImage(ctx, background, CANVAS_WIDTH, height);

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
  veil.addColorStop(0.35, 'rgba(0, 0, 0, 0.25)');
  veil.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  const icon = await loadIcon(data.iconURL);
  const avatarRadius = 48;
  const avatarX = 40 + avatarRadius;
  const avatarY = 85;
  drawAvatar(ctx, icon, data.guildName, avatarX, avatarY, avatarRadius, `bold 40px ${RANK_FONT_FAMILY}`);

  const titleX = avatarX + avatarRadius + 30;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.font = `bold 34px ${RANK_FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText(truncate(data.guildName, 24), titleX, avatarY - 6);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `16px ${RANK_FONT_FAMILY}`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'left';
  ctx.fillText('SERVER STATISTICS', titleX, avatarY + 24);
  ctx.restore();

  const stats: readonly [string, string][] = [
    ['MEMBERS', data.memberCount.toLocaleString()],
    ['HUMANS', data.humanCount.toLocaleString()],
    ['BOTS', data.botCount.toLocaleString()],
    ['IN VOICE', data.voiceNow.toLocaleString()],
    ['TEXT CHANNELS', data.textChannels.toLocaleString()],
    ['VOICE CHANNELS', data.voiceChannels.toLocaleString()],
    ['ROLES', data.roleCount.toLocaleString()],
    ['BOOSTS', `${data.boostCount.toLocaleString()} (Lvl ${data.boostTier})`],
  ];

  const startX = (CANVAS_WIDTH - gridWidth) / 2;
  stats.forEach(([label, value], index) => {
    const column = index % STATS_COLUMNS;
    const row = Math.floor(index / STATS_COLUMNS);
    const x = startX + column * (STATS_STAT_BOX_W + STATS_STAT_GAP);
    const y = headerHeight + row * (STATS_STAT_BOX_H + STATS_STAT_GAP);
    drawServerStatBox(ctx, label, value, x, y);
  });

  return canvas.toBuffer('image/png');
}
