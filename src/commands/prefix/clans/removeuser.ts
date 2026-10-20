import type { Command } from '../../../core/types';

const command: Command = {
  name: 'removeuser',
  aliases: ['remove'],
  description: 'Remove a member from your clan.',
  usage: '',
  category: 'clans',
  logic: 'clanRemove',
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
