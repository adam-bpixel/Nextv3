import type { User } from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { renderRankCard, type RankStat } from '../checker/canvas/rankcard';

export async function rankPage(user: User, chat: RankStat, voice: RankStat): Promise<ReplyPayload> {
  const fileName = `rank-${user.id}.png`;
  const image = await renderRankCard({
    username: user.username,
    avatarURL: user.displayAvatarURL({ size: 512 }),
    avatarDecorationURL: user.avatarDecorationURL({ size: 512 }),
    chat,
    voice,
  });

  return {
    files: [{ attachment: image, name: fileName }],
  };
}
