import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup alttracker',
  menuType: 'slash',
  description: 'Open the alt account tracker setup panel.',
  options: [],
  logic: 'setupAlttrackerPanel',
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
