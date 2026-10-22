import type { Command } from '../../../core/types';

const command: Command = {
  name: 'blur',
  aliases: [],
  description: 'Blur an image or avatar. Requires Premium.',
  usage: '[user] [1-50]',
  category: 'premium',
  logic: 'blur',
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
