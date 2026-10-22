import fs from 'node:fs';
import path from 'node:path';
import type { AttachmentPayload } from 'discord.js';
import { PROJECT_ROOT } from './config';

export const DIVIDER_FILE_NAME = 'divider.gif';

const DIVIDER_PATH = path.join(PROJECT_ROOT, 'assets', 'images', DIVIDER_FILE_NAME);

let cached: Buffer | null = null;

export function dividerFile(): AttachmentPayload {
  cached ??= fs.readFileSync(DIVIDER_PATH);
  return { attachment: cached, name: DIVIDER_FILE_NAME };
}

export function dividerComponent(): object {
  return { type: 12, items: [{ media: { url: `attachment://${DIVIDER_FILE_NAME}` } }] };
}
