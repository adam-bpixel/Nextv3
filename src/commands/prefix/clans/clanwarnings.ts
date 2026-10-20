import type { Command } from '../../../core/types';

const command: Command = {
  name: 'clanwarnings',
  aliases: [],
  description: 'View warnings for a clan.',
  usage: '',
  category: 'clans',
  logic: 'clanWarnings',
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
