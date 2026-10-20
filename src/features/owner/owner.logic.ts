import type { CommandHandler } from '../../core/types';
import { ownerEconomyLogic } from './owner.logic.economy';
import { ownerFleetLogic } from './owner.logic.fleet';
import { ownerProcessLogic } from './owner.logic.process';
import { ownerProfilesLogic } from './owner.logic.profiles';
import { ownerServersLogic } from './owner.logic.servers';

export const ownerLogic = {
  ...ownerServersLogic,
  ...ownerEconomyLogic,
  ...ownerProcessLogic,
  ...ownerProfilesLogic,
  ...ownerFleetLogic,
} satisfies Record<string, CommandHandler>;
