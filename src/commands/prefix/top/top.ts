import type { Command } from '../../../core/types';

const command: Command = {
  name: 'top',
  aliases: ['lb'],
  description: 'Rank clans, your clan members, inviters, verificators, chat, voice, XP activity, or coins as an image leaderboard.',
  usage: '<clans|members|invites|verif|chat|voice|xp|coins>',
  category: 'Top',
  logic: 'top',
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
