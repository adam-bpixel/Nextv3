import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup verification',
  menuType: 'slash',
  description: 'Open the verification system setup panel.',
  options: [],
  logic: 'setupVerificationPanel',
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
