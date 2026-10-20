import type { Command } from '../../../core/types';

const command: Command = {
  name: 'clanupdate',
  aliases: [],
  description: 'Edit clan name, limits, tag, color, voice channel, or avatar.',
  usage: '',
  category: 'clans',
  logic: 'clanEdit',
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
