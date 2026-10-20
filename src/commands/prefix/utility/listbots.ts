import type { Command } from '../../../core/types';

const command: Command = {
  name: 'listbots',
  aliases: ['bots', 'botlist'],
  description: 'List server bots and their roles.',
  usage: '[server ID]',
  category: 'Checker',
  logic: 'listbots',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: 'ok',
  recordingFile: 'prefix/listbots.json',
};

export = command;
