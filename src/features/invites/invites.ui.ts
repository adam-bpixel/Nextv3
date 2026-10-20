import { ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from 'discord.js';
import type { ReplyPayload } from '../../core/context';

const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
const sep = (): SeparatorBuilder => new SeparatorBuilder();
const smallSep = (): SeparatorBuilder => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

export interface InviteStatsCard {
  userId: string;
  name: string;
  avatarURL: string;
  valid: number;
  fake: number;
  left: number;
}

export function inviteStatsCard(accentColor: number, card: InviteStatsCard): ReplyPayload {
  const lines = [
    `- __**Valid**__ ﹕ \`${card.valid}\``,
    `- __**Fake**__ ﹕ \`${card.fake}\``,
    `- __**Left**__ ﹕ \`${card.left}\``,
  ].join('\n');
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text(`# ${card.name} Invites`))
    .addSeparatorComponents(smallSep())
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(card.avatarURL).setDescription(`${card.name}'s avatar`)))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}
