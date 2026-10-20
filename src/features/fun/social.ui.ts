import { ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from 'discord.js';
import type { ReplyPayload } from '../../core/context';

const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
const smallSep = (): SeparatorBuilder => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

export function actionCard(line: string, gifUrl: string): ReplyPayload {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(text(`# ${line}`))
    .addSeparatorComponents(smallSep())
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(gifUrl)));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export function textCard(title: string, body: string): ReplyPayload {
  const container = new ContainerBuilder().addTextDisplayComponents(text(`# ${title}\n${body}`));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export function catCard(username: string, imageUrl: string): ReplyPayload {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(text(`# ${username}'s Cat!`))
    .addSeparatorComponents(smallSep())
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl)));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export function susListCard(guildName: string, userIds: readonly string[]): ReplyPayload {
  const lines = userIds.map((id, index) => `${index + 1}. <@${id}>`).join('\n') || 'No sus users yet.';
  const container = new ContainerBuilder()
    .addTextDisplayComponents(text(`# ${guildName} - Sus Users`))
    .addSeparatorComponents(smallSep())
    .addTextDisplayComponents(text(lines));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
