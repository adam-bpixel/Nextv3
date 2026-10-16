import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { get, xpToNextLevel } from './levels.model';

const THUMBNAIL_SIZE = 256;

export const levelsLogic = {
  async rank(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const user = await ctx.targetUser();
    const progress = await get(guild.id, user.id);
    await ctx.send(
      ctx.embed({
        title: `${user.username}'s rank`,
        thumbnail: { url: user.displayAvatarURL({ size: THUMBNAIL_SIZE }) },
        fields: [
          { name: 'Level', value: String(progress.level), inline: true },
          { name: 'XP', value: `${progress.xp} / ${xpToNextLevel(progress.level)}`, inline: true },
        ],
      }),
    );
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
