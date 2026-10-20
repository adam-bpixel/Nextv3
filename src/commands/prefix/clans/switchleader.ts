import type { Command } from '../../../core/types';

const command: Command = {
  name: 'switchleader',
  aliases: ['transferleader'],
  description: 'Transfer clan leadership.',
  usage: '',
  category: 'clans',
  logic: 'clanTransfer',
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
