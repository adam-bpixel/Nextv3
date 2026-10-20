import { Router } from 'express';
import type { BotClient } from '../../core/client';
import { fullCheck, listAdmins, listBots, myServerRank, roleCheck, voiceCheck, voiceLeaderboard } from '../controllers/checker.controller';
import { asyncHandler } from '../utils/asyncHandler';

export function createCheckerRouter(client: BotClient): Router {
  const router = Router();
  router.get('/fullcheck/:userId', asyncHandler(fullCheck(client)));
  router.get('/rolecheck/:userId', asyncHandler(roleCheck(client)));
  router.get('/voicecheck/:userId', asyncHandler(voiceCheck(client)));
  router.get('/voice-leaderboard', asyncHandler(voiceLeaderboard(client)));
  router.get('/myserver/:guildId', asyncHandler(myServerRank(client)));
  router.get('/admins/:guildId', asyncHandler(listAdmins(client)));
  router.get('/bots/:guildId', asyncHandler(listBots(client)));
  return router;
}
