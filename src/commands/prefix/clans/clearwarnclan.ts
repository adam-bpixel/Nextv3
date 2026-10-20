import type { Command } from '../../../core/types';

const command: Command = {
  name: 'clearwarnclan',
  aliases: [],
  description: 'Clear warnings recorded for a clan.',
  usage: '',
  category: 'clans',
  logic: 'clanClearWarnings',
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
