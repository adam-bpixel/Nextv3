import config from '../../core/config';
import { storeImage, storeImageBuffer } from '../../core/image-storage';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import {
  createProfileBackground,
  equipProfileBackground,
  getProfileBackground,
  giveProfileBackground,
  listProfileBackgrounds,
  listProfileShopListings,
  ownsProfileBackground,
  removeProfileBackground,
  removeProfileShopListing,
  setProfileShopListing,
} from './owner.model';
import { profileShopPanel } from '../profile/shop.ui';
import { ensureProfileShopPreview, purchaseProfileBackground } from '../profile/shop.service';
import { cachedColor } from '../theme/theme.model';
import { renderProfileCard } from '../checker/canvas/profilecard';
import { errorFailure, money, ownerUsage, parseShopStock, positiveAmount, profileShopUsage, randomBetween, targetFrom, usageFailure } from './owner.logic.helpers';

async function createProfile(ctx: Parameters<CommandHandler>[0]): Promise<void> {
  const attachment = ctx.source.kind === 'message' ? ctx.source.message.attachments.first() : undefined;
  const url = attachment?.url ?? ctx.args[0];
  if (attachment && !attachment.contentType?.startsWith('image/')) {
    await ctx.send(errorReply(ctx, 'Attach an image file to create a profile background.'));
    return;
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    await ownerUsage(ctx, 'prcreate', '[image attachment or URL]');
    return;
  }
  if (!config.webhookUrl) {
    await ctx.send(errorReply(ctx, 'Set WEBHOOK_URL in .env so the background and its preview can be hosted for the shop.'));
    return;
  }
  let storedImageUrl: string;
  try {
    storedImageUrl = await storeImage(url, attachment?.name ?? 'profile-background.png');
  } catch (error) {
    console.error('Storing profile background image failed:', error);
    await ctx.send(errorReply(ctx, 'The profile image could not be saved. Check the webhook URL and make sure the image is accessible and under 8 MB.'));
    return;
  }
  const randomDayOffset = randomBetween(5, 365);
  let previewBuffer: Buffer;
  let previewUrl: string;
  try {
    const botUser = ctx.client.user;
    previewBuffer = await renderProfileCard({
      username: botUser?.globalName ?? botUser?.username ?? config.botName,
      handle: `@${botUser?.username ?? config.botName}`,
      joinedAt: Date.now() - randomDayOffset * 24 * 60 * 60 * 1000,
      backgroundURL: storedImageUrl,
      serverTag: null,
      avatarURL: botUser?.displayAvatarURL({ size: 256 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
      avatarDecorationURL: null,
      rank: randomBetween(1, 999),
      total: randomBetween(1000, 10000),
      voiceRank: randomBetween(1, 999),
      voiceTotal: randomBetween(1000, 10000),
      level: randomBetween(1, 150),
      xp: randomBetween(0, 5000),
      xpToNext: randomBetween(5000, 10000),
      wallet: randomBetween(100, 250000),
      bank: randomBetween(1000, 1000000),
      currency: config.economy.currency,
      badgeURLs: [],
      connections: [],
      commandsUsed: randomBetween(10, 5000),
    });
    const hostedPreview = await storeImageBuffer(previewBuffer, `profile-preview-${Date.now()}.png`);
    if (!hostedPreview) throw new Error('No webhook URL is configured for preview hosting.');
    previewUrl = hostedPreview;
  } catch (error) {
    console.error('Generating or hosting profile preview failed:', error);
    await ctx.send(errorReply(ctx, 'The profile preview could not be created or hosted. Check the WEBHOOK_URL and try again.'));
    return;
  }
  const profile = await createProfileBackground(storedImageUrl, previewUrl);
  await ctx.send(successReply(ctx, `- Created profile background #${profile.id}.\n- The generated preview was hosted for the shop.\n- Use ${ctx.prefix}prgive <user> ${profile.id} to assign it.`));
}

async function manageProfileShop(ctx: Parameters<CommandHandler>[0]): Promise<void> {
  const [sub, idRaw, ...rest] = ctx.args;
  const id = Number(idRaw);
  if (sub === 'remove' && Number.isInteger(id)) {
    const removed = await removeProfileShopListing(id);
    await ctx.send(removed ? successReply(ctx, `- Removed profile **#${id}** from the shop.`) : errorReply(ctx, `Profile **#${id}** was not found.`));
    return;
  }
  if (sub === 'add' && Number.isInteger(id) && rest.length >= 3) {
    const stock = parseShopStock(rest.at(-1));
    const price = positiveAmount(rest.at(-2));
    const name = rest.slice(0, -2).join(' ').trim();
    if (!price || stock === null || !name) {
      await ownerUsage(ctx, 'prshop', 'add <profile id> <name> <price> <stock|unlimited>');
      return;
    }
    const profile = await getProfileBackground(id);
    if (!profile) {
      await ctx.send(errorReply(ctx, `Profile **#${id}** was not found.`));
      return;
    }
    try {
      const botUser = ctx.client.user;
      await ensureProfileShopPreview(profile, {
        displayName: botUser?.globalName ?? botUser?.username ?? config.botName,
        username: botUser?.username ?? config.botName,
        avatarURL: botUser?.displayAvatarURL({ size: 256 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
      }, true);
    } catch (error) {
      console.error(`Generating shop preview for profile #${id} failed:`, error);
      await ctx.send(errorReply(ctx, 'The profile preview could not be generated and hosted. Check WEBHOOK_URL and make sure the source image is accessible. The item was not added.'));
      return;
    }
    const updated = await setProfileShopListing(id, { name, price, stock });
    await ctx.send(updated ? successReply(ctx, `- Generated and hosted the preview for **#${id} ${name}**.\n- Added it to the profile shop.\n- Price: ${money(price)}\n- Stock: ${stock === -1 ? 'Unlimited' : stock}`) : errorReply(ctx, `Profile **#${id}** was not found.`));
    return;
  }
  if (sub === 'edit' && Number.isInteger(id) && rest.length >= 2) {
    const [field, ...valueParts] = rest;
    const value = valueParts.join(' ').trim();
    const current = await getProfileBackground(id);
    if (!current?.name) {
      await ctx.send(errorReply(ctx, `Profile **#${id}** is not listed in the shop.`));
      return;
    }
    const patch = field === 'name' && value
      ? { name: value }
      : field === 'price' && positiveAmount(value) !== null
        ? { price: positiveAmount(value) }
        : field === 'stock' && parseShopStock(value) !== null
          ? { stock: parseShopStock(value) }
          : null;
    if (!patch) {
      await ownerUsage(ctx, 'prshop', 'edit <profile id> <name|price|stock> <value>');
      return;
    }
    await setProfileShopListing(id, { name: patch.name ?? current.name, price: patch.price ?? current.price!, stock: patch.stock ?? current.stock! });
    await ctx.send(successReply(ctx, `- Updated **#${id}** shop listing (${field}).`));
    return;
  }
  await profileShopUsage(ctx);
}

export const ownerProfilesLogic = {
  async ownerProfileCreate(ctx) {
    await createProfile(ctx);
    return 'completed';
  },

  async ownerProfileGive(ctx) {
    const target = await targetFrom(ctx);
    const id = Number(ctx.args[1]);
    if (!target || !Number.isInteger(id) || id <= 0) return usageFailure(ctx, `Mention a user and give a valid profile ID.\nUse: \`${ctx.prefix}prgive <user mention or ID> <profile id>\`.`);
    if (await ownsProfileBackground(target.id, id)) return errorFailure(ctx, `<@${target.id}> already owns profile **#${id}**.`);
    if (!(await giveProfileBackground(target.id, id))) return errorFailure(ctx, `Profile **#${id}** was not found.`);
    await equipProfileBackground(target.id, id);
    await ctx.send(successReply(ctx, `- Gave profile background **#${id}** to <@${target.id}> and equipped it.`));
    return 'completed';
  },

  async ownerProfileRemove(ctx) {
    const target = await targetFrom(ctx);
    const id = Number(ctx.args[1]);
    if (!target || !Number.isInteger(id) || id <= 0) return usageFailure(ctx, `Mention a user and give a valid profile ID.\nUse: \`${ctx.prefix}prremove <user mention or ID> <profile id>\`.`);
    if (!(await removeProfileBackground(target.id, id))) return errorFailure(ctx, `<@${target.id}> does not own profile **#${id}**.`);
    await ctx.send(successReply(ctx, `- Removed profile background **#${id}** from <@${target.id}>.`));
    return 'completed';
  },

  async ownerProfileList(ctx) {
    const profiles = (await listProfileBackgrounds()).slice(0, 25);
    await ctx.send(successReply(ctx, profiles.length
      ? profiles.map((profile) => `- **#${profile.id}** · ${profile.name ?? 'Not listed'}${profile.price !== null ? ` · ${money(profile.price)}` : ''}`).join('\n')
      : '- No profile backgrounds have been created yet.'));
    return 'completed';
  },

  async ownerProfileShop(ctx) {
    await manageProfileShop(ctx);
    return 'completed';
  },

  async profileShop(ctx) {
    const sub = ctx.args[0]?.toLowerCase();
    if (sub === 'buy') {
      const id = Number(ctx.args[1]);
      if (!Number.isInteger(id) || id <= 0) return usageFailure(ctx, `Give a valid profile ID.\nUse: \`${ctx.prefix}shop buy <profile id>\`.`);
      const result = await purchaseProfileBackground(ctx.user.id, id);
      if (!result.ok) return errorFailure(ctx, result.message);
      await ctx.send(successReply(ctx, `- Bought and equipped ${result.profile.name} for ${result.price.toLocaleString('en-US')} ${config.economy.currency}.`));
      return 'completed';
    }

    let listings = await listProfileShopListings();
    const first = listings[0];
    if (first) {
      try {
        const botUser = ctx.client.user;
        const preview = await ensureProfileShopPreview(first, {
          displayName: botUser?.globalName ?? botUser?.username ?? config.botName,
          username: botUser?.username ?? config.botName,
          avatarURL: botUser?.displayAvatarURL({ size: 256 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png',
        });
        listings = [preview, ...listings.slice(1)];
      } catch (error) {
        console.error('Preparing profile shop preview failed:', error);
        await ctx.send(errorReply(ctx, 'The generated shop preview could not be created or hosted. Check WEBHOOK_URL and make sure the source image is accessible.'));
        return 'completed';
      }
    }
    await ctx.send(profileShopPanel({
      listings,
      page: 0,
      userId: ctx.user.id,
      accentColor: ctx.guild ? cachedColor(ctx.guild.id) : undefined,
    }));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
