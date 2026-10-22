import type { Command } from '../../../core/types';

const command: Command = {
  name: 'removebg',
  aliases: ['rmbg', 'nobg'],
  description: 'Remove the background from an image or avatar. Requires Premium.',
  usage: '[user]',
  category: 'premium',
  logic: 'removebg',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 30,
  voice: false,
  dm: false,
  kind: 'premium',
  recordingFile: null,
};

export = command;
