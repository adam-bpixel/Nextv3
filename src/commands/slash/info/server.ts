import type { Command } from '../../../core/types';

const command: Command = {
  path: 'server',
  menuType: 'slash',
  description: 'Show this server information',
  options: [],
  logic: 'serverinfo',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: null,
};

export = command;
