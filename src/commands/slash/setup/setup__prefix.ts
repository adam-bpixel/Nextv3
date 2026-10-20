import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup prefix',
  menuType: 'slash',
  description: 'Open the prefix setup panel.',
  options: [],
  logic: 'setupPrefixPanel',
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
