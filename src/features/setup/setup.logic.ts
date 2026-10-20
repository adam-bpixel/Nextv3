import type { CommandHandler } from '../../core/types';
import { setupOverviewLogic } from './setup.logic.overview';
import { setupVerificationLogic } from './setup.logic.verification';
import { setupModerationLogic } from './setup.logic.moderation';
import { setupCommunityLogic } from './setup.logic.community';
import { setupTicketsLogic } from './setup.logic.tickets';
import { setupPrefixLogic } from './setup.logic.prefix';

export const setupLogic = {
  ...setupOverviewLogic,
  ...setupVerificationLogic,
  ...setupModerationLogic,
  ...setupCommunityLogic,
  ...setupTicketsLogic,
  ...setupPrefixLogic,
} satisfies Record<string, CommandHandler>;
