import { createCanvas, loadImage } from '@napi-rs/canvas';
import { ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import type { CommandHandler } from '../../core/types';
import { errorReply } from '../../core/usage-replies';

const SAMPLE_SIZE = 64;
const BUCKET_STEP = 16;
const MIN_ALPHA = 128;
const PALETTE_SIZE = 5;
const MIN_DISTANCE = 60;
const SWATCH_WIDTH = 160;
const SWATCH_HEIGHT = 120;

type Rgb = [number, number, number];

function toHex([red, green, blue]: Rgb): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function distance(first: Rgb, second: Rgb): number {
  return Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
}

function dominantColors(data: Uint8ClampedArray): Rgb[] {
  const buckets = new Map<number, { count: number; red: number; green: number; blue: number }>();
  for (let index = 0; index < data.length; index += 4) {
    if ((data[index + 3] ?? 0) < MIN_ALPHA) continue;
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const key = (Math.floor(red / BUCKET_STEP) << 8) | (Math.floor(green / BUCKET_STEP) << 4) | Math.floor(blue / BUCKET_STEP);
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count++;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  const palette: Rgb[] = [];
  for (const bucket of [...buckets.values()].sort((a, b) => b.count - a.count)) {
    const color: Rgb = [Math.round(bucket.red / bucket.count), Math.round(bucket.green / bucket.count), Math.round(bucket.blue / bucket.count)];
    if (palette.every((existing) => distance(existing, color) >= MIN_DISTANCE)) palette.push(color);
    if (palette.length === PALETTE_SIZE) break;
  }
  return palette;
}

function paletteImage(palette: readonly Rgb[]): Buffer {
  const canvas = createCanvas(SWATCH_WIDTH * palette.length, SWATCH_HEIGHT);
  const context = canvas.getContext('2d');
  palette.forEach((color, index) => {
    context.fillStyle = toHex(color);
    context.fillRect(index * SWATCH_WIDTH, 0, SWATCH_WIDTH, SWATCH_HEIGHT);
  });
  return canvas.toBuffer('image/png');
}

export const colorsLogic = {
  async colors(ctx) {
    const user = await ctx.targetUser();
    const member = await ctx.targetMember();
    const avatarURL = (member ?? user).displayAvatarURL({ extension: 'png', size: 256 });

    const palette = await loadImage(avatarURL)
      .then((image) => {
        const canvas = createCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        return dominantColors(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
      })
      .catch(() => []);

    const first = palette[0];
    if (!first) {
      await ctx.send(errorReply(ctx, "I couldn't read that avatar's colors."));
      return 'skipped';
    }

    const lines = palette.map((color, index) => `- __**Color ${index + 1}**__ ﹕ \`${toHex(color)}\``);
    const container = new ContainerBuilder()
      .setAccentColor((first[0] << 16) | (first[1] << 8) | first[2])
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Colors — ${user.username}\n${lines.join('\n')}`))
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://colors.png')));

    await ctx.send({
      components: [container.toJSON()],
      flags: MessageFlags.IsComponentsV2,
      files: [{ attachment: paletteImage(palette), name: 'colors.png' }],
      allowedMentions: { parse: [] },
    });
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
