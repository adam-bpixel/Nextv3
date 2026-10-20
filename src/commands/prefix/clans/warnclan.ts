import type { Command } from '../../../core/types';

const command: Command = {
  name: 'warnclan',
  aliases: [],
  description: 'Issue a warning to a clan.',
  usage: '',
  category: 'clans',
  logic: 'clanWarn',
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
