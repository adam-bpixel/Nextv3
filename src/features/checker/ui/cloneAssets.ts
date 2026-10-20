import { ContainerBuilder, FileBuilder, MessageFlags } from 'discord.js';
import type { AttachmentPayload } from 'discord.js';
import config from '../../../core/config';
import { type CheckerPage, sep, text, toPage } from './shared';

export function cloneAssetsPage(title: string, body: string, fileName?: string): CheckerPage {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${title}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(body));

  if (fileName) container.addSeparatorComponents(sep()).addFileComponents(new FileBuilder().setURL(`attachment://${fileName}`));
  return toPage(container);
}

export function cloneAssetsPayload(page: CheckerPage, fileName: string, buffer: Buffer): CheckerPage & { files: AttachmentPayload[] } {
  return {
    components: page.components,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
    files: [{ attachment: buffer, name: fileName }],
  };
}
