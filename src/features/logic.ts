import type { CommandHandler } from '../core/types';
import { checkerLogic } from './checker/checker.logic';
import { clansLogic } from './clans/logic';
import { economyLogic } from './economy/economy.logic';
import { funLogic } from './fun/fun.logic';
import { gamesLogic } from './games/games.logic';
import { infoLogic } from './info/info.logic';
import { interactionsLogic } from './fun/interactions';
import { invitesLogic } from './invites/invites.logic';
import { jailLogic } from './moderation/jail.logic';
import { levelsLogic } from './levels/levels.logic';
import { moderationLogic } from './moderation/moderation.logic';
import { ownerLogic } from './owner/owner.logic';
import { prefixLogic } from './prefix/prefix.logic';
import { premiumLogic } from './premium/premium.logic';
import { profileLogic } from './profile/profile.logic';
import { rolesLogic } from './roles/roles.logic';
import { securityLogic } from './security/security.logic';
import { serverLogic } from './server/server.logic';
import { setupLogic } from './setup/setup.logic';
import { socialLogic } from './fun/social.logic';
import { themeLogic } from './theme/theme.logic';
import { topLogic } from './top/top.logic';
import { verificationLogic } from './verification/verification.logic';
import { voiceLogic } from './voice/voice.logic';
import { voiceCountLogic } from './voice/voiceCount.logic';
import { voiceModLogic } from './voice/voiceMod.logic';

const LOGIC_GROUPS = [
  infoLogic,
  funLogic,
  socialLogic,
  moderationLogic,
  ownerLogic,
  prefixLogic,
  economyLogic,
  levelsLogic,
  profileLogic,
  rolesLogic,
  voiceLogic,
  voiceModLogic,
  voiceCountLogic,
  checkerLogic,
  clansLogic,
  jailLogic,
  securityLogic,
  serverLogic,
  setupLogic,
  themeLogic,
  verificationLogic,
  topLogic,
  invitesLogic,
  premiumLogic,
  gamesLogic,
  interactionsLogic,
] as const;

export type LogicName =
  | keyof typeof infoLogic
  | keyof typeof funLogic
  | keyof typeof socialLogic
  | keyof typeof moderationLogic
  | keyof typeof ownerLogic
  | keyof typeof prefixLogic
  | keyof typeof economyLogic
  | keyof typeof levelsLogic
  | keyof typeof profileLogic
  | keyof typeof rolesLogic
  | keyof typeof voiceLogic
  | keyof typeof voiceModLogic
  | keyof typeof voiceCountLogic
  | keyof typeof checkerLogic
  | keyof typeof clansLogic
  | keyof typeof jailLogic
  | keyof typeof securityLogic
  | keyof typeof serverLogic
  | keyof typeof setupLogic
  | keyof typeof themeLogic
  | keyof typeof verificationLogic
  | keyof typeof topLogic
  | keyof typeof invitesLogic
  | keyof typeof premiumLogic
  | keyof typeof gamesLogic
  | keyof typeof interactionsLogic;

function collectHandlers(): ReadonlyMap<string, CommandHandler> {
  const handlers = new Map<string, CommandHandler>();
  for (const group of LOGIC_GROUPS) {
    for (const [name, handler] of Object.entries(group)) {
      if (handlers.has(name)) throw new Error(`Built-in logic "${name}" is defined by two features`);
      handlers.set(name, handler);
    }
  }
  return handlers;
}

const handlers = collectHandlers();

export function isLogicName(name: string): name is LogicName {
  return handlers.has(name);
}

export function logicHandler(name: LogicName): CommandHandler {
  const handler = handlers.get(name);
  if (!handler) throw new Error(`Built-in logic "${name}" is missing`);
  return handler;
}

export const logicNames = (): string[] => [...handlers.keys()];
