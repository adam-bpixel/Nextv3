import type { Command } from '../../../core/types';

const command: Command = {
  name: 'createclan',
  aliases: [],
  description: 'Create a clan and assign its leader.',
  usage: '',
  category: 'clans',
  logic: 'clanCreate',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 1800,
  voice: false,
  dm: false,
  kind: 'usage',
  recordingFile: null,
};

export = command;
