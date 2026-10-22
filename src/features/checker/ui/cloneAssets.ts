import { ContainerBuilder, FileBuilder, MessageFlags } from 'discord.js';
import type { AttachmentPayload } from 'discord.js';
import config from '../../../core/config';
import { type CheckerPage, sep, text, toPage } from './shared';

export function cloneAssetsPage(title: string, body: string, fileNames: readonly string[] = []): CheckerPage {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${title}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(body));

  if (fileNames.length > 0) {
    container.addSeparatorComponents(sep());
    for (const fileName of fileNames) container.addFileComponents(new FileBuilder().setURL(`attachment://${fileName}`));
  }
  return toPage(container);
}

export function cloneAssetsPayload(page: CheckerPage, archives: readonly { name: string; data: Buffer }[]): CheckerPage & { files: AttachmentPayload[] } {
  return {
    components: page.components,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
    files: archives.map((archive) => ({ attachment: archive.data, name: archive.name })),
  };
}
