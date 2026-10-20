import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import type { RankStat } from '../checker/canvas/rankcard';
import { get, type LevelKind, topInGuild, xpToNextLevel } from './levels.model';
import { rankPage } from './levels.ui';

async function buildRankStat(guildId: string, userId: string, kind: LevelKind): Promise<RankStat> {
  const [progress, leaderboard] = await Promise.all([get(guildId, userId, kind), topInGuild(guildId, kind, Number.MAX_SAFE_INTEGER)]);
  const rankIndex = leaderboard.findIndex((entry) => entry.userId === userId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : leaderboard.length + 1;
  const total = Math.max(leaderboard.length, rank);
  return { level: progress.level, xp: progress.xp, xpToNext: xpToNextLevel(progress.level), rank, total };
}

export const levelsLogic = {
  async rank(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const user = await ctx.targetUser();
    const [chat, voice] = await Promise.all([buildRankStat(guild.id, user.id, 'chat'), buildRankStat(guild.id, user.id, 'voice')]);
    await ctx.send(await rankPage(user, chat, voice));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
