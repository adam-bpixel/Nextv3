import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup mute',
  menuType: 'slash',
  description: 'Open the mute system setup panel.',
  options: [],
  logic: 'setupMutePanel',
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
