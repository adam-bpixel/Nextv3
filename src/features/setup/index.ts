import { altTrackerRoutes } from './setup.routes.alttracker';
import { applyRoutes } from './setup.routes.apply';
import { autoReplyRoutes } from './setup.routes.autoreply';
import { autoRoleRoutes } from './setup.routes.autorole';
import { blacklistRoutes } from './setup.routes.blacklist';
import { checkerRoutes } from './setup.routes.checker';
import { clansRoutes } from './setup.routes.clans';
import { commandsRoutes } from './setup.routes.commands';
import { gameFinderRoutes } from './setup.routes.gamefinder';
import { jailRoutes } from './setup.routes.jail';
import { levelRolesRoutes } from './setup.routes.levelroles';
import { muteRoutes } from './setup.routes.mute';
import { overviewRoutes } from './setup.routes.overview';
import { prefixRoutes } from './setup.routes.prefix';
import { selfRoleRoutes } from './setup.routes.selfrole';
import { ticketRoutes } from './setup.routes.ticket';
import { verificationRoutes } from './setup.routes.verification';
import { warnRoutes } from './setup.routes.warn';

export const routes = [
  ...overviewRoutes,
  ...ticketRoutes,
  ...applyRoutes,
  ...autoReplyRoutes,
  ...autoRoleRoutes,
  ...selfRoleRoutes,
  ...clansRoutes,
  ...altTrackerRoutes,
  ...muteRoutes,
  ...gameFinderRoutes,
  ...jailRoutes,
  ...levelRolesRoutes,
  ...verificationRoutes,
  ...warnRoutes,
  ...blacklistRoutes,
  ...prefixRoutes,
  ...checkerRoutes,
  ...commandsRoutes,
];
