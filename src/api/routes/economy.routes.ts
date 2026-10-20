import { Router } from 'express';
import { getLeaderboard, getWallet } from '../controllers/economy.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const economyRouter = Router();

economyRouter.get('/leaderboard', asyncHandler(getLeaderboard));
economyRouter.get('/:userId', asyncHandler(getWallet));
