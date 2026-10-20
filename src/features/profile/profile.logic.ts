import config from '../../core/config';
import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { resolveBadgeEmojiURLs } from './badgeEmojis';
import { fetchUserProfileBadges } from './badges';
import { fetchUserConnections } from './connections';
import { loadWallet } from '../economy/wallet.model';
import { get as getLevel, topInGuild } from '../levels/levels.model';
import { commandsUsedBy } from '../stats/commandStats.model';
import { profileImage } from './profile.ui';
import { equippedProfileBackground } from '../owner/owner.model';
import { inventoryMenuPanel } from './inventory.ui';
import { cachedColor } from '../theme/theme.model';

function rankWithin(leaderboard: readonly { userId: string }[], userId: string): { rank: number; total: number } {
  const index = leaderboard.findIndex((entry) => entry.userId === userId);
  const rank = index >= 0 ? index + 1 : leaderboard.length + 1;
  return { rank, total: Math.max(leaderboard.length, rank) };
}

export const profileLogic = {
  async profile(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';

    const user = await ctx.targetUser();
    if (ctx.source.kind === 'command' && !ctx.source.interaction.deferred && !ctx.source.interaction.replied) {
      await ctx.source.interaction.deferReply();
    }
    const [member, progress, wallet, chatLeaderboard, voiceLeaderboard, badges, connections, commandsUsed, profileBackground] = await Promise.all([
      guild.members.fetch(user.id).catch(() => null),
      getLevel(guild.id, user.id, 'chat'),
      loadWallet(user.id),
      topInGuild(guild.id, 'chat', Number.MAX_SAFE_INTEGER),
      topInGuild(guild.id, 'voice', Number.MAX_SAFE_INTEGER),
      fetchUserProfileBadges(user),
      fetchUserConnections(user),
      commandsUsedBy(user.id),
      equippedProfileBackground(user.id),
    ]);
    const { rank, total } = rankWithin(chatLeaderboard, user.id);
    const { rank: voiceRank, total: voiceTotal } = rankWithin(voiceLeaderboard, user.id);
    const displayName = member?.displayName ?? user.globalName ?? user.username;
    const badgeURLs = await resolveBadgeEmojiURLs(ctx.client, badges);

    await ctx.send(
      await profileImage({
        user,
        displayName,
        joinedAt: member?.joinedTimestamp ?? null,
        backgroundURL: profileBackground?.imageUrl ?? null,
        progress,
        wallet,
        rank,
        total,
        voiceRank,
        voiceTotal,
        currency: config.economy.currency,
        badgeURLs,
        connections,
        commandsUsed,
      }),
    );
    return 'completed';
  },
  async inventory(ctx) {
    await ctx.send(inventoryMenuPanel({ userId: ctx.user.id, accentColor: ctx.guild ? cachedColor(ctx.guild.id) : undefined }));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
