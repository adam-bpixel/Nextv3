import { Router } from 'express';
import { getLeaderboard, getProgress } from '../controllers/levels.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const levelsRouter = Router();

levelsRouter.get('/:guildId/leaderboard', asyncHandler(getLeaderboard));
levelsRouter.get('/:guildId/:userId', asyncHandler(getProgress));
