import type { Request, Response } from 'express';
import { commandsUsedBy } from '../../features/stats/commandStats.model';
import { ok } from '../types';
import { requireParam } from '../utils/query';

export async function getCommandUsage(req: Request, res: Response): Promise<void> {
  const userId = requireParam(req.params.userId, 'userId');
  res.json(ok({ userId, commandsUsed: await commandsUsedBy(userId) }));
}
