import type { Command } from '../../../core/types';

const command: Command = {
  name: 'clans',
  aliases: [],
  description: 'List clans in this server (clan managers and Administrators only).',
  usage: '',
  category: 'clans',
  logic: 'clans',
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
