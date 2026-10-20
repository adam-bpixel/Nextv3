import type { Command } from '../../../core/types';

const command: Command = {
  name: 'deleteclan',
  aliases: [],
  description: 'Delete a clan and remove its role.',
  usage: '',
  category: 'clans',
  logic: 'clanDelete',
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
