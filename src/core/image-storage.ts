import { WebhookClient } from 'discord.js';
import config from './config';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function uploadBufferToWebhook(image: Buffer, preferredName: string): Promise<string | null> {
  if (!config.webhookUrl) return null;
  if (!image.length || image.length > MAX_IMAGE_BYTES) throw new Error('Images must be 8 MB or smaller.');
  const safeName = preferredName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'image';
  const webhook = new WebhookClient({ url: config.webhookUrl });
  const message = await webhook.send({
    files: [{ attachment: image, name: safeName }],
    allowedMentions: { parse: [] },
  });
  const hostedUrl = message.attachments[0]?.url;
  if (!hostedUrl) throw new Error('The webhook did not return an uploaded image.');
  return hostedUrl;
}


export async function storeImage(inputUrl: string, preferredName: string): Promise<string> {
  if (!config.webhookUrl) return inputUrl;
  if (!/^https?:\/\//i.test(inputUrl)) throw new Error('Image URL must use HTTP or HTTPS.');

  const response = await fetch(inputUrl);
  if (!response.ok) throw new Error(`Image download failed with status ${response.status}.`);
  const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (!contentType?.startsWith('image/')) throw new Error('The provided file is not an image.');
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) throw new Error('Images must be 8 MB or smaller.');

  const image = Buffer.from(await response.arrayBuffer());
  if (!image.length || image.length > MAX_IMAGE_BYTES) throw new Error('Images must be 8 MB or smaller.');

  return (await uploadBufferToWebhook(image, preferredName)) ?? inputUrl;
}


export async function storeImageBuffer(image: Buffer, preferredName: string): Promise<string | null> {
  return uploadBufferToWebhook(image, preferredName);
}
