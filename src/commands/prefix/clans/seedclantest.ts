import type { Command } from '../../../core/types';

const command: Command = {
  name: 'seedclantest',
  aliases: ['seedtestclans', 'testclans', 'seedclans'],
  description: '(Admin only) Add/remove fake clans using real members and roles, to preview the leaderboard.',
  usage: '[clean]',
  category: 'clans',
  logic: 'seedClanTest',
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
