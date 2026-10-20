import type { Request, Response } from 'express';
import { loadWallet, richest } from '../../features/economy/wallet.model';
import { ok } from '../types';
import { parseLimit, requireParam } from '../utils/query';

export async function getWallet(req: Request, res: Response): Promise<void> {
  const userId = requireParam(req.params.userId, 'userId');
  res.json(ok(await loadWallet(userId)));
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const limit = parseLimit(req.query.limit, 10, 100);
  res.json(ok(await richest(limit)));
}
