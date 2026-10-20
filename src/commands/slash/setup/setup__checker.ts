import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup checker',
  menuType: 'slash',
  description: 'Open the checker roles setup panel.',
  options: [],
  logic: 'setupCheckerPanel',
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
