import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup gamefinder',
  menuType: 'slash',
  description: 'Open the game finder setup panel.',
  options: [],
  logic: 'setupGamefinderPanel',
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
