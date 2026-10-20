import type { Command } from '../../../core/types';

const command: Command = {
  name: 'claninfo',
  aliases: ['clan', 'myclan'],
  description: 'Show clan details and voice activity.',
  usage: '',
  category: 'clans',
  logic: 'clanInfo',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'usage',
  recordingFile: null,
};

export = command;
