import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup warn',
  menuType: 'slash',
  description: 'Open the warn system setup panel.',
  options: [],
  logic: 'setupWarnPanel',
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
