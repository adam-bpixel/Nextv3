import type { Command } from '../../../core/types';

const command: Command = {
  name: 'rank',
  aliases: ['level'],
  description: 'Show a member’s server level, XP progress, and rank',
  usage: '[@user/id]',
  category: 'Levels',
  logic: 'rank',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: 'prefix/rank.json',
};

export = command;
