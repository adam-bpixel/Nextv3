import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup selfrole',
  menuType: 'slash',
  description: 'Open the self-role setup panel.',
  options: [],
  logic: 'setupSelfrolePanel',
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
