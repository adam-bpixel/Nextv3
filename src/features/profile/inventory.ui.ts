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
import {
  ARROW_LEFT_GOLD,
  ARROW_RIGHT_GOLD,
  INVENTORY_BALANCE_ICON,
  INVENTORY_BOOST_ICON,
  INVENTORY_HEADER_ICON,
  INVENTORY_PROFILES_ICON,
} from '../../core/emojis';
import type { ReplyPayload } from '../../core/context';
import type { OwnerProfileBackground } from '../owner/owner.model';
import type { Wallet } from '../economy/wallet.model';

export const INVENTORY_MENU_ACTION = 'inventory:menu:';
export const INVENTORY_PROFILE_ACTION = 'inventory:profile:';

interface InventoryMenuOptions {
  userId: string;
  accentColor?: number | undefined;
}

export function inventoryMenuPanel(options: InventoryMenuOptions): ReplyPayload {
  const { userId, accentColor } = options;
  const menuAction = (section: string): string => `${INVENTORY_MENU_ACTION}${userId}:${section}`;

  const container = new ContainerBuilder().setAccentColor(accentColor ?? config.color);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${INVENTORY_HEADER_ICON} Inventory`));
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('-# Browse your profile backgrounds, check your balance, and view your active XP boost.'),
  );
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(menuAction('profiles')).setLabel('Profiles').setEmoji(INVENTORY_PROFILES_ICON).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(menuAction('balance')).setLabel('Balance').setEmoji(INVENTORY_BALANCE_ICON).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(menuAction('boost')).setLabel('Boost').setEmoji(INVENTORY_BOOST_ICON).setStyle(ButtonStyle.Secondary),
    ),
  );

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}

interface InventoryBalanceOptions {
  wallet: Wallet;
  accentColor?: number | undefined;
}

export function inventoryBalancePanel(options: InventoryBalanceOptions): ReplyPayload {
  const { wallet, accentColor } = options;
  const container = new ContainerBuilder().setAccentColor(accentColor ?? config.color);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${INVENTORY_BALANCE_ICON} Balance`));
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent([
      `- -# **__Wallet__** · ${wallet.wallet.toLocaleString('en-US')} ${config.economy.currency}`,
      `- -# **__Bank__** · ${wallet.bank.toLocaleString('en-US')} ${config.economy.currency}`,
      `- -# **__Total__** · ${wallet.total.toLocaleString('en-US')} ${config.economy.currency}`,
    ].join('\n')),
  );

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  };
}

interface InventoryBoostOptions {
  boost: { multiplier: number; expiresAt: number } | null;
  accentColor?: number | undefined;
}

export function inventoryBoostPanel(options: InventoryBoostOptions): ReplyPayload {
  const { boost, accentColor } = options;
  const container = new ContainerBuilder().setAccentColor(accentColor ?? config.color);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${INVENTORY_BOOST_ICON} XP Boost`));
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `- -# **__Status__** · ${boost ? `x${boost.multiplier} until <t:${Math.floor(boost.expiresAt / 1000)}:R>` : 'None active'}`,
    ),
  );

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  };
}

interface InventoryProfilesOptions {
  userId: string;
  backgrounds: readonly OwnerProfileBackground[];
  equipped: OwnerProfileBackground | null;
  accentColor?: number | undefined;
  page?: number;
  notice?: string | undefined;
}

export function inventoryProfilesPanel(options: InventoryProfilesOptions): ReplyPayload {
  const { userId, backgrounds, equipped, accentColor, notice } = options;
  const entries: ({ id: number; name: string; imageUrl: string } | { id: null; name: string; imageUrl: null })[] = [
    { id: null, name: 'Default background', imageUrl: null },
    ...backgrounds.map((background) => ({
      id: background.id,
      name: background.name ?? `Background #${background.id}`,
      imageUrl: background.previewUrl ?? background.imageUrl,
    })),
  ];
  const page = Math.min(Math.max(options.page ?? Math.max(0, entries.findIndex((entry) => entry.id === (equipped?.id ?? null))), 0), entries.length - 1);
  const entry = entries[page];
  if (!entry) {
    return {
      components: [new ContainerBuilder().setAccentColor(accentColor ?? config.color).addTextDisplayComponents(
        new TextDisplayBuilder().setContent('- -# **__You have no profile backgrounds.__**'),
      ).toJSON()],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    };
  }
  const isEquipped = entry.id === (equipped?.id ?? null);
  const actionId = (action: string): string => `${INVENTORY_PROFILE_ACTION}${userId}:${page}:${action}`;

  const container = new ContainerBuilder().setAccentColor(accentColor ?? config.color);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${INVENTORY_PROFILES_ICON} Profile Backgrounds · ${page + 1}/${entries.length}`));
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent([
      `**${entry.name}**${isEquipped ? ' · Equipped' : ''}`,
      ...(notice ? [`- -# ${notice}`] : []),
    ].join('\n')),
  );
  if (entry.imageUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(entry.imageUrl).setDescription(entry.name)),
    );
  }
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(actionId('prev')).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId(actionId('next')).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(page >= entries.length - 1),
      new ButtonBuilder()
        .setCustomId(actionId('equip'))
        .setLabel(isEquipped ? 'Equipped' : 'Equip')
        .setStyle(isEquipped ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setDisabled(isEquipped),
    ),
  );

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  };
}
