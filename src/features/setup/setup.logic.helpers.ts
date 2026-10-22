import { MessageFlags } from 'discord.js';
import { isOwner } from '../../core/config';
import { isPremiumUser } from '../premium/premium.model';

export function ephemeral<T extends { flags?: number }>(payload: T): T {
  return { ...payload, flags: (payload.flags ?? 0) | MessageFlags.Ephemeral };
}

export async function canUseSelfPrefix(userId: string): Promise<boolean> {
  return isOwner(userId) || isPremiumUser(userId);
}
