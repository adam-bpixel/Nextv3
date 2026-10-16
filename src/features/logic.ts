import type { CommandHandler } from '../core/types';
import { checkerLogic } from './checker/checker.logic';
import { economyLogic } from './economy/economy.logic';
import { funLogic } from './fun/fun.logic';
import { infoLogic } from './info/info.logic';
import { levelsLogic } from './levels/levels.logic';
import { moderationLogic } from './moderation/moderation.logic';
import { setupLogic } from './setup/setup.logic';
import { verificationLogic } from './verification/verification.logic';
import { voiceLogic } from './voice/voice.logic';

const LOGIC_GROUPS = [infoLogic, funLogic, moderationLogic, economyLogic, levelsLogic, voiceLogic, checkerLogic, setupLogic, verificationLogic] as const;

export type LogicName =
  | keyof typeof infoLogic
  | keyof typeof funLogic
  | keyof typeof moderationLogic
  | keyof typeof economyLogic
  | keyof typeof levelsLogic
  | keyof typeof voiceLogic
  | keyof typeof checkerLogic
  | keyof typeof setupLogic
  | keyof typeof verificationLogic;

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
