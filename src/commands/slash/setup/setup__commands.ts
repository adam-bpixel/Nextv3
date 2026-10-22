import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup commands',
  menuType: 'slash',
  description: 'Open the disabled commands setup panel.',
  options: [],
  logic: 'setupCommandsPanel',
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
