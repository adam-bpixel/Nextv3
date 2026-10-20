import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup jail',
  menuType: 'slash',
  description: 'Open the jail system setup panel.',
  options: [],
  logic: 'setupJailPanel',
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
