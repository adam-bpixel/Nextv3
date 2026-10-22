import { createCanvas, loadImage } from '@napi-rs/canvas';
import { isOwner } from '../../core/config';
import type { Ctx } from '../../core/context';
import type { CommandHandler } from '../../core/types';
import { errorReply } from '../../core/usage-replies';
import { isPremiumUser } from '../premium/premium.model';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const DEFAULT_BLUR = 10;
const MAX_BLUR = 50;
const FETCH_TIMEOUT_MS = 20_000;
const REMOVEBG_ENDPOINT = 'https://api.remove.bg/v1.0/removebg';
const IMAGE_TYPE = /^image\/(png|jpe?g|webp|gif)/i;

async function requirePremium(ctx: Ctx): Promise<boolean> {
  if (isOwner(ctx.user.id) || (await isPremiumUser(ctx.user.id))) return true;
  await ctx.send(errorReply(ctx, 'This command is available to **Premium** subscribers only.'));
  return false;
}

async function resolveImageUrl(ctx: Ctx): Promise<string> {
  if (ctx.source.kind === 'message') {
    const message = ctx.source.message;
    const own = message.attachments.find((attachment) => IMAGE_TYPE.test(attachment.contentType ?? ''));
    if (own) return own.url;
    const referenced = message.reference?.messageId ? await message.fetchReference().catch(() => null) : null;
    const quoted = referenced?.attachments.find((attachment) => IMAGE_TYPE.test(attachment.contentType ?? ''));
    if (quoted) return quoted.url;
  }
  const target = await ctx.targetUser();
  return target.displayAvatarURL({ extension: 'png', size: 1024 });
}

async function downloadImage(url: string): Promise<Buffer | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch(() => null);
  if (!response?.ok) return null;
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) return null;
  const data = Buffer.from(await response.arrayBuffer());
  return data.length > 0 && data.length <= MAX_IMAGE_BYTES ? data : null;
}

function blurAmount(args: readonly string[]): number {
  for (const arg of args) {
    if (/^\d{1,2}$/.test(arg)) return Math.min(MAX_BLUR, Math.max(1, Number(arg)));
  }
  return DEFAULT_BLUR;
}

export const imageToolsLogic = {
  async blur(ctx) {
    if (!(await requirePremium(ctx))) return 'skipped';
    const data = await downloadImage(await resolveImageUrl(ctx));
    if (!data) {
      await ctx.send(errorReply(ctx, "I couldn't read that image. Attach an image under 10 MB, reply to one, or mention a user."));
      return 'skipped';
    }

    const image = await loadImage(data).catch(() => null);
    if (!image) {
      await ctx.send(errorReply(ctx, "That file isn't a supported image."));
      return 'skipped';
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.filter = `blur(${blurAmount(ctx.args)}px)`;
    context.drawImage(image, 0, 0, width, height);

    await ctx.send({ files: [{ attachment: canvas.toBuffer('image/png'), name: 'blur.png' }], allowedMentions: { parse: [] } });
    return 'completed';
  },

  async removebg(ctx) {
    if (!(await requirePremium(ctx))) return 'skipped';
    const apiKey = (process.env.REMOVEBG_API_KEY ?? '').trim();
    if (!apiKey) {
      await ctx.send(errorReply(ctx, 'Background removal is not available right now.'));
      return 'skipped';
    }

    const data = await downloadImage(await resolveImageUrl(ctx));
    if (!data) {
      await ctx.send(errorReply(ctx, "I couldn't read that image. Attach an image under 10 MB, reply to one, or mention a user."));
      return 'skipped';
    }

    const form = new FormData();
    form.append('image_file', new Blob([new Uint8Array(data)]), 'image.png');
    form.append('size', 'auto');
    const response = await fetch(REMOVEBG_ENDPOINT, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
      signal: AbortSignal.timeout(60_000),
    }).catch(() => null);

    if (!response) {
      await ctx.send(errorReply(ctx, "The background remover didn't respond. Try again in a moment."));
      return 'skipped';
    }
    if (!response.ok) {
      const reason = response.status === 402 ? 'The background remover is out of credits.' : response.status === 403 ? 'The background remover key is invalid.' : "I couldn't remove the background from that image.";
      console.error(`remove.bg returned HTTP ${response.status}.`);
      await ctx.send(errorReply(ctx, reason));
      return 'skipped';
    }

    await ctx.send({ files: [{ attachment: Buffer.from(await response.arrayBuffer()), name: 'removebg.png' }], allowedMentions: { parse: [] } });
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
