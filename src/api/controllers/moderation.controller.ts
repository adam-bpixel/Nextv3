import type { Request, Response } from 'express';
import { listWarnings } from '../../features/moderation/warnings.model';
import { ok } from '../types';
import { requireParam } from '../utils/query';

export async function getWarnings(req: Request, res: Response): Promise<void> {
  const guildId = requireParam(req.params.guildId, 'guildId');
  const userId = requireParam(req.params.userId, 'userId');
  res.json(ok(await listWarnings(guildId, userId)));
}
