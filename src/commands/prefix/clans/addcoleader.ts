import type { Command } from '../../../core/types';

const command: Command = {
  name: 'addcoleader',
  aliases: [],
  description: 'Promote a clan member to co-leader.',
  usage: '',
  category: 'clans',
  logic: 'clanPromote',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 10,
  voice: false,
  dm: false,
  kind: 'usage',
  recordingFile: null,
};

export = command;
