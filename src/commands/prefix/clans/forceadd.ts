import type { Command } from '../../../core/types';

const command: Command = {
  name: 'forceadd',
  aliases: [],
  description: 'Move a user into a clan as a member.',
  usage: '',
  category: 'clans',
  logic: 'clanForceAdd',
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
