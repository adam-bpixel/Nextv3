import type { Request, Response } from 'express';
import { get, topCombinedInGuild, topInGuild, xpToNextLevel, type LevelKind } from '../../features/levels/levels.model';
import { ok } from '../types';
import { parseLimit, requireParam } from '../utils/query';

function parseKind(raw: unknown): LevelKind | null {
  return raw === 'chat' || raw === 'voice' ? raw : null;
}

export async function getProgress(req: Request, res: Response): Promise<void> {
  const guildId = requireParam(req.params.guildId, 'guildId');
  const userId = requireParam(req.params.userId, 'userId');
  const [chat, voice] = await Promise.all([get(guildId, userId, 'chat'), get(guildId, userId, 'voice')]);
  res.json(ok({ chat: { ...chat, nextLevelXp: xpToNextLevel(chat.level) }, voice: { ...voice, nextLevelXp: xpToNextLevel(voice.level) } }));
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const guildId = requireParam(req.params.guildId, 'guildId');
  const limit = parseLimit(req.query.limit, 10, 100);
  const kind = parseKind(req.query.kind);
  if (kind) {
    res.json(ok(await topInGuild(guildId, kind, limit)));
    return;
  }
  res.json(ok(await topCombinedInGuild(guildId, limit)));
}
