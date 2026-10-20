import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup autorole',
  menuType: 'slash',
  description: 'Open the auto role setup panel.',
  options: [],
  logic: 'setupAutorolePanel',
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
