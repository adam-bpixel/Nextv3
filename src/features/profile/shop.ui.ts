import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import config from '../../core/config';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD } from '../../core/emojis';
import type { ReplyPayload } from '../../core/context';
import type { OwnerProfileBackground } from '../owner/owner.model';

export const PROFILE_SHOP_ACTION = 'profile-shop:';

interface ProfileShopPanelOptions {
  listings: readonly OwnerProfileBackground[];
  page: number;
  userId: string;
  accentColor?: number | undefined;
}

export function profileShopPanel(options: ProfileShopPanelOptions): ReplyPayload {
  const { listings, userId, accentColor } = options;
  const pages = Math.max(1, listings.length);
  const page = Math.min(Math.max(options.page, 0), pages - 1);
  const profile = listings[page];
  const container = new ContainerBuilder().setAccentColor(accentColor ?? config.color);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Background Shop${listings.length ? ` · ${page + 1}/${pages}` : ''}`));

  if (!profile) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('- -# **__The profile background shop is empty.__**'));
  } else {
    const stock = profile.stock === -1 ? 'Unlimited' : `${profile.stock} left`;
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${profile.name ?? `Background #${profile.id}`}`));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `- -# **__Price__** · \`${profile.price!.toLocaleString('en-US')} ${config.economy.currency}\``,
        `- -# **__Stock__** · \`${stock}\``,
        `- -# **__ID__** · \`#${profile.id}\``,
      ].join('\n')),
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    if (profile.previewUrl) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(profile.previewUrl).setDescription(`${profile.name ?? `Background #${profile.id}`} profile preview`),
        ),
      );
    } else {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('- -# **__Generated preview is not available.__**'));
    }
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${PROFILE_SHOP_ACTION}${userId}:${page}:prev`)
          .setEmoji(ARROW_LEFT_GOLD)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId(`${PROFILE_SHOP_ACTION}${userId}:${page}:next`)
          .setEmoji(ARROW_RIGHT_GOLD)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= listings.length - 1),
        new ButtonBuilder()
          .setCustomId(`${PROFILE_SHOP_ACTION}${userId}:${page}:buy:${profile.id}`)
          .setLabel('Buy')
          .setStyle(ButtonStyle.Success)
          .setDisabled(profile.stock === 0),
      ),
    );
  }

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}
