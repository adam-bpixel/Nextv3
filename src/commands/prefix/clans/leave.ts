import type { Command } from '../../../core/types';

const command: Command = {
  name: 'leave',
  aliases: [],
  description: 'Leave your current clan.',
  usage: '',
  category: 'clans',
  logic: 'clanLeave',
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
