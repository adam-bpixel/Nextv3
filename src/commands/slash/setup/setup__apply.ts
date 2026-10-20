import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup apply',
  menuType: 'slash',
  description: 'Open the application system setup panel.',
  options: [],
  logic: 'setupApplyPanel',
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
