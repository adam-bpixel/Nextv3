import { Router } from 'express';
import type { BotClient } from '../../core/client';
import { getGuild, getMember, listGuilds } from '../controllers/guild.controller';
import { asyncHandler } from '../utils/asyncHandler';

export function createGuildRouter(client: BotClient): Router {
  const router = Router();
  router.get('/', listGuilds(client));
  router.get('/:guildId', getGuild(client));
  router.get('/:guildId/members/:userId', asyncHandler(getMember(client)));
  return router;
}
