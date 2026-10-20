import {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
  type APIMessageTopLevelComponent,
  type AttachmentPayload,
} from 'discord.js';
import config from '../../core/config';

export interface ServerStatsPage {
  components: APIMessageTopLevelComponent[];
  flags: number;
  allowedMentions: { parse: [] };
  files: AttachmentPayload[];
}

export function serverStatsPage(guildName: string, accentColor: number, buffer: Buffer): ServerStatsPage {
  const fileName = 'server-stats.png';
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${guildName}'s Stats`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# © ${new Date().getFullYear()} ${config.botName} All rights reserved`));

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
    files: [{ attachment: buffer, name: fileName }],
  };
}
