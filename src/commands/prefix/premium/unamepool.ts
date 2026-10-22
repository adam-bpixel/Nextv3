import type { Command } from '../../../core/types';

const command: Command = {
  name: 'unamepool',
  aliases: ['handlepool'],
  description: 'Show how many rare handles are ready in the Handle Hunter pool. Requires Premium.',
  usage: '',
  category: 'premium',
  logic: 'unamepool',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 10,
  voice: false,
  dm: false,
  kind: 'premium',
  recordingFile: null,
};

export = command;
