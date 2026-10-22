import type { Command } from '../../../core/types';

const command: Command = {
  name: 'uname',
  aliases: ['handlehunter'],
  description: 'Get an available rare 4L or 5L Discord handle in your DMs. Requires Premium.',
  usage: '',
  category: 'premium',
  logic: 'uname',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 60,
  voice: false,
  dm: false,
  kind: 'premium',
  recordingFile: null,
};

export = command;
