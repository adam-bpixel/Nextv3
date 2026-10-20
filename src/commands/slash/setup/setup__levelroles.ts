import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup levelroles',
  menuType: 'slash',
  description: 'Open the level roles setup panel.',
  options: [],
  logic: 'setupLevelrolesPanel',
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
