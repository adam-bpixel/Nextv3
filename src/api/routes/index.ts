import { Router } from 'express';
import type { BotClient } from '../../core/client';
import { createCheckerRouter } from './checker.routes';
import { economyRouter } from './economy.routes';
import { createGuildRouter } from './guild.routes';
import { levelsRouter } from './levels.routes';
import { moderationRouter } from './moderation.routes';
import { statsRouter } from './stats.routes';

export function createApiRouter(client: BotClient): Router {
  const router = Router();
  router.use('/checker', createCheckerRouter(client));
  router.use('/economy', economyRouter);
  router.use('/levels', levelsRouter);
  router.use('/moderation', moderationRouter);
  router.use('/stats', statsRouter);
  router.use('/guilds', createGuildRouter(client));
  return router;
}
