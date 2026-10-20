import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup blacklist',
  menuType: 'slash',
  description: 'Open the channel blacklist setup panel.',
  options: [],
  logic: 'setupBlacklistPanel',
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
