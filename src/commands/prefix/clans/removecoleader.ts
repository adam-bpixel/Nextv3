import type { Command } from '../../../core/types';

const command: Command = {
  name: 'removecoleader',
  aliases: [],
  description: 'Demote a co-leader to a clan member.',
  usage: '',
  category: 'clans',
  logic: 'clanDemote',
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
