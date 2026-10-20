import type { Command } from '../../../core/types';

const command: Command = {
  name: 'adduser',
  aliases: ['addclan'],
  description: 'Add a member to your clan.',
  usage: '',
  category: 'clans',
  logic: 'clanAdd',
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
