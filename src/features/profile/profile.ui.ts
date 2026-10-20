import type { User } from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { renderProfileCard } from '../checker/canvas/profilecard';
import type { UserConnection } from './connections';
import type { Wallet } from '../economy/wallet.model';
import type { LevelProgress } from '../levels/levels.model';
import { xpToNextLevel } from '../levels/levels.model';

export interface ProfileImageOptions {
  user: User;
  displayName: string;
  joinedAt: number | null;
  backgroundURL?: string | null;
  progress: LevelProgress;
  wallet: Wallet;
  rank: number;
  total: number;
  voiceRank: number;
  voiceTotal: number;
  currency: string;
  badgeURLs: readonly string[];
  connections: readonly UserConnection[];
  commandsUsed: number;
}

export async function profileImage(options: ProfileImageOptions): Promise<ReplyPayload> {
  const { user, displayName, joinedAt, backgroundURL, progress, wallet, rank, total, voiceRank, voiceTotal, currency, badgeURLs, connections, commandsUsed } = options;
  const fileName = `profile-${user.id}.png`;
  const serverTag =
    user.primaryGuild?.identityEnabled && user.primaryGuild.tag
      ? { text: user.primaryGuild.tag, badgeURL: user.guildTagBadgeURL({ size: 64 }) }
      : null;
  const image = await renderProfileCard({
    username: displayName,
    handle: `@${user.username}`,
    joinedAt,
    backgroundURL,
    serverTag,
    avatarURL: user.displayAvatarURL({ size: 512 }),
    avatarDecorationURL: user.avatarDecorationURL({ size: 512 }),
    rank,
    total,
    voiceRank,
    voiceTotal,
    level: progress.level,
    xp: progress.xp,
    xpToNext: xpToNextLevel(progress.level),
    wallet: wallet.wallet,
    bank: wallet.bank,
    currency,
    badgeURLs,
    connections,
    commandsUsed,
  });
  return { files: [{ attachment: image, name: fileName }] };
}
