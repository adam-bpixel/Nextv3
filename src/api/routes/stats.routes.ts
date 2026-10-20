import { Router } from 'express';
import { getCommandUsage } from '../controllers/stats.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const statsRouter = Router();

statsRouter.get('/commands/:userId', asyncHandler(getCommandUsage));
