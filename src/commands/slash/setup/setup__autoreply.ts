import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup autoreply',
  menuType: 'slash',
  description: 'Open the auto reply setup panel.',
  options: [],
  logic: 'setupAutoreplyPanel',
  ai: null,
  permissions: ['manage_guild'],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: null,
};

export = command;
