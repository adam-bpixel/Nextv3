import type { Command } from '../../../core/types';

const command: Command = {
  name: 'newmembers',
  aliases: ['newest', 'latestmembers'],
  description: 'List the last 100 members who joined a server.',
  usage: '[server ID]',
  category: 'Checker',
  logic: 'newmembers',
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
