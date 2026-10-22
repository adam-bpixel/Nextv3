import type { Command } from '../../../core/types';

const command: Command = {
  name: 'profile',
  aliases: ['pf', 'p'],
  description: 'Show a member profile as an image card',
  usage: '[@user/id]',
  category: 'Profile',
  logic: 'profile',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: 'prefix/profile.json',
};

export = command;
