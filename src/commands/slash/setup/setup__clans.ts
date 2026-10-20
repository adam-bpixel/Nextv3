import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup clans',
  menuType: 'slash',
  description: 'Open the clans setup panel.',
  options: [],
  logic: 'setupClansPanel',
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
