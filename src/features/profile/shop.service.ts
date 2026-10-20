import config from '../../core/config';
import { storeImageBuffer } from '../../core/image-storage';
import { loadWallet, saveWallet } from '../economy/wallet.model';
import { renderProfileCard } from '../checker/canvas/profilecard';
import {
  equipProfileBackground,
  getProfileBackground,
  giveProfileBackground,
  ownsProfileBackground,
  refundProfileBackgroundStock,
  saveProfileBackgroundPreview,
  takeProfileBackgroundStock,
  type OwnerProfileBackground,
} from '../owner/owner.model';

const randomBetween = (minimum: number, maximum: number): number => minimum + Math.floor(Math.random() * (maximum - minimum + 1));

export interface ProfilePreviewIdentity {
  displayName: string;
  username: string;
  avatarURL: string;
}


export async function ensureProfileShopPreview(
  profile: OwnerProfileBackground,
  identity: ProfilePreviewIdentity,
  force = false,
): Promise<OwnerProfileBackground> {
  if (!force && profile.previewUrl && profile.previewUrl !== profile.imageUrl) return profile;
  if (!config.webhookUrl) throw new Error('WEBHOOK_URL is required to generate and host shop previews.');

  const randomDayOffset = randomBetween(5, 365);
  const previewBuffer = await renderProfileCard({
    username: identity.displayName,
    handle: `@${identity.username}`,
    joinedAt: Date.now() - randomDayOffset * 24 * 60 * 60 * 1000,
    backgroundURL: profile.imageUrl,
    serverTag: null,
    avatarURL: identity.avatarURL,
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
  const previewUrl = await storeImageBuffer(previewBuffer, `profile-preview-${profile.id}.png`);
  if (!previewUrl) throw new Error('The generated profile preview could not be hosted. Check WEBHOOK_URL.');
  if (!(await saveProfileBackgroundPreview(profile.id, previewUrl))) throw new Error(`Profile #${profile.id} no longer exists.`);
  return { ...profile, previewUrl };
}

export type ProfilePurchaseResult =
  | { ok: true; profile: OwnerProfileBackground; price: number }
  | { ok: false; message: string };

export async function purchaseProfileBackground(userId: string, id: number): Promise<ProfilePurchaseResult> {
  const profile = await getProfileBackground(id);
  if (!profile || profile.name === null || profile.price === null || profile.stock === null) {
    return { ok: false, message: `Profile #${id} is not available in the shop.` };
  }
  if (await ownsProfileBackground(userId, id)) return { ok: false, message: 'You already own this profile background.' };

  const wallet = await loadWallet(userId);
  if (wallet.wallet < profile.price) {
    return { ok: false, message: `You need ${profile.price.toLocaleString('en-US')} ${config.economy.currency} in your wallet to buy this background.` };
  }
  if (!(await takeProfileBackgroundStock(id))) return { ok: false, message: 'This profile background is sold out.' };

  try {
    await saveWallet(userId, { ...wallet, wallet: wallet.wallet - profile.price });
    const given = await giveProfileBackground(userId, id);
    if (!given) throw new Error('Profile background disappeared during purchase.');
    await equipProfileBackground(userId, id);
  } catch (error) {
    await refundProfileBackgroundStock(id).catch(() => undefined);
    await saveWallet(userId, wallet).catch(() => undefined);
    throw error;
  }

  return { ok: true, profile, price: profile.price };
}
