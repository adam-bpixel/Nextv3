import { MessageFlags, type ButtonInteraction, type Client } from 'discord.js';
import config from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { loadWallet } from '../economy/wallet.model';
import { listProfileShopListings, type OwnerProfileBackground } from '../owner/owner.model';
import {
  activeXpBoost,
  clearEquippedProfileBackground,
  equipProfileBackground,
  equippedProfileBackground,
  ownedProfileBackgrounds,
} from '../owner/owner.model';
import {
  inventoryBalancePanel,
  inventoryBoostPanel,
  inventoryProfilesPanel,
} from './inventory.ui';
import { profileShopPanel } from './shop.ui';
import { ensureProfileShopPreview, purchaseProfileBackground } from './shop.service';

const MENU_ACTION = /^inventory:menu:(\d{15,22}):(profiles|balance|boost)$/;
const PROFILE_ACTION = /^inventory:profile:(\d{15,22}):(\d+):(prev|next|equip)$/;
const SHOP_ACTION = /^profile-shop:(\d{15,22}):(\d+):(prev|next|buy)(?::(\d+))?$/;


async function ensureOwnedBackgroundPreview(backgrounds: OwnerProfileBackground[], page: number, client: Client): Promise<OwnerProfileBackground[]> {
  const index = page - 1;
  const background = backgrounds[index];
  if (page === 0 || !background || (background.previewUrl && background.previewUrl !== background.imageUrl)) return backgrounds;
  const botUser = client.user;
  try {
    backgrounds[index] = await ensureProfileShopPreview(background, {
      displayName: botUser?.globalName ?? botUser?.username ?? config.botName,
      username: botUser?.username ?? config.botName,
      avatarURL: botUser?.displayAvatarURL({ size: 256 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
    });
  } catch (error) {
    console.error('Preparing owned profile preview failed:', error);
  }
  return backgrounds;
}

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'profile:inventory:menu',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && MENU_ACTION.test(interaction.customId),
    async handle(interaction) {
      const match = MENU_ACTION.exec(interaction.customId);
      if (!match) return;
      const [, ownerId, section] = match;
      if (interaction.user.id !== ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Only the user who opened this inventory can use these buttons.'));
        return;
      }

      const accentColor = interaction.guildId ? cachedColor(interaction.guildId) : undefined;
      if (section === 'balance') {
        const wallet = await loadWallet(ownerId);
        await interaction.reply(inventoryBalancePanel({ wallet, accentColor }));
        return;
      }
      if (section === 'boost') {
        const boost = await activeXpBoost(ownerId);
        await interaction.reply(inventoryBoostPanel({ boost, accentColor }));
        return;
      }

      const [backgrounds, equipped] = await Promise.all([ownedProfileBackgrounds(ownerId), equippedProfileBackground(ownerId)]);
      const defaultPage = equipped ? 1 + backgrounds.findIndex((background) => background.id === equipped.id) : 0;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await ensureOwnedBackgroundPreview(backgrounds, defaultPage, interaction.client);
      await interaction.editReply(inventoryProfilesPanel({ userId: ownerId, backgrounds, equipped, accentColor, page: defaultPage }));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'profile:inventory:background',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && PROFILE_ACTION.test(interaction.customId),
    async handle(interaction) {
      const match = PROFILE_ACTION.exec(interaction.customId);
      if (!match) return;
      const [, ownerId, pageText, action] = match;
      if (interaction.user.id !== ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Only the user who opened this inventory can change these items.'));
        return;
      }

      const requestedPage = Number(pageText);
      if (!Number.isSafeInteger(requestedPage)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'This inventory page is invalid.'));
        return;
      }

      await interaction.deferUpdate();
      const backgrounds = await ownedProfileBackgrounds(ownerId);
      let page = requestedPage;
      let notice: string | undefined;
      if (action === 'prev') page -= 1;
      if (action === 'next') page += 1;
      if (action === 'equip') {
        const selected = page === 0 ? null : backgrounds[page - 1];
        if (page === 0) {
          await clearEquippedProfileBackground(ownerId);
          notice = 'Default background equipped.';
        } else if (!selected || !(await equipProfileBackground(ownerId, selected.id))) {
          await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'You do not own that profile background.'));
          return;
        } else {
          notice = 'Background updated.';
        }
      }

      await ensureOwnedBackgroundPreview(backgrounds, page, interaction.client);
      const equipped = await equippedProfileBackground(ownerId);
      await interaction.editReply(inventoryProfilesPanel({
        userId: ownerId,
        backgrounds,
        equipped,
        accentColor: interaction.guildId ? cachedColor(interaction.guildId) : undefined,
        page,
        notice,
      }));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'profile:shop',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && SHOP_ACTION.test(interaction.customId),
    async handle(interaction) {
      const match = SHOP_ACTION.exec(interaction.customId);
      if (!match) return;
      const [, ownerId, pageText, action, profileIdText] = match;
      if (interaction.user.id !== ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Only the user who opened this shop page can use these buttons.'));
        return;
      }

      const page = Number(pageText);
      if (!Number.isSafeInteger(page)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'This shop page is invalid.'));
        return;
      }

      if (action === 'buy') {
        const profileId = Number(profileIdText);
        if (!Number.isSafeInteger(profileId) || profileId <= 0) {
          await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'This background selection is invalid.'));
          return;
        }
        const result = await purchaseProfileBackground(ownerId, profileId);
        if (!result.ok) {
          await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', result.message));
          return;
        }
        await interaction.reply(themedReplyFor(
          interaction.guildId,
          true,
          'success',
          `Bought and equipped ${result.profile.name} for ${result.price.toLocaleString('en-US')} ${config.economy.currency}.`,
        ));
        return;
      }

      const listings = await listProfileShopListings();
      const nextPage = page + (action === 'next' ? 1 : -1);
      const safePage = Math.min(Math.max(nextPage, 0), Math.max(0, listings.length - 1));
      let listing = listings[safePage];
      if (listing && (!listing.previewUrl || listing.previewUrl === listing.imageUrl)) {
        await interaction.deferUpdate();
        try {
          const botUser = interaction.client.user;
          listing = await ensureProfileShopPreview(listing, {
            displayName: botUser?.globalName ?? botUser?.username ?? config.botName,
            username: botUser?.username ?? config.botName,
            avatarURL: botUser?.displayAvatarURL({ size: 256 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
          });
          listings[safePage] = listing;
        } catch (error) {
          console.error('Preparing profile shop preview failed:', error);
          await interaction.followUp(themedReplyFor(
            interaction.guildId,
            true,
            'error',
            'The generated shop preview could not be created or hosted. Check WEBHOOK_URL and make sure the source image is accessible.',
          ));
          return;
        }
        await interaction.editReply(profileShopPanel({
          listings,
          page: safePage,
          userId: ownerId,
          accentColor: interaction.guildId ? cachedColor(interaction.guildId) : undefined,
        }));
        return;
      }
      await interaction.update(profileShopPanel({
        listings,
        page: safePage,
        userId: ownerId,
        accentColor: interaction.guildId ? cachedColor(interaction.guildId) : undefined,
      }));
    },
  }),
];
