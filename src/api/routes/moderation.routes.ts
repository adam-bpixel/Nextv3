import { Router } from 'express';
import { getWarnings } from '../controllers/moderation.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const moderationRouter = Router();

moderationRouter.get('/warnings/:guildId/:userId', asyncHandler(getWarnings));
