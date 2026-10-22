import type { Command } from '../../../core/types';

const command: Command = {
  name: 'oldmembers',
  aliases: ['oldest', 'firstmembers'],
  description: 'List the first 100 members who joined a server.',
  usage: '[server ID]',
  category: 'Checker',
  logic: 'oldmembers',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: 'ok',
  recordingFile: null,
};

export = command;
