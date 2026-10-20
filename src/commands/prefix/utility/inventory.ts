import type { Command } from '../../../core/types';

const command: Command = {
  name: 'inventory',
  aliases: ['inv'],
  description: 'View your wallet, bank, profile backgrounds, and active boosts.',
  usage: '',
  category: 'Profile',
  logic: 'inventory',
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
