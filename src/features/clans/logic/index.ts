import type { CommandHandler } from '../../../core/types';
import { clansAdminLogic } from './admin.logic';
import { clansMembershipLogic } from './membership.logic';
import { clansSeedLogic } from './seed.logic';
import { clansViewLogic } from './view.logic';

export const clansLogic = {
  ...clansAdminLogic,
  ...clansMembershipLogic,
  ...clansViewLogic,
  ...clansSeedLogic,
} satisfies Record<string, CommandHandler>;

export { performClanAdd, performClanPromote, refreshClanLeaderboard, syncClanRoleAssignments } from './service';
