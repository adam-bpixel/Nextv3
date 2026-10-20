import type { Command } from '../../../core/types';

const command: Command = {
  name: 'prefix',
  aliases: ['setprefix'],
  description: 'View or change this server’s prefix, or your personal prefix (Premium).',
  usage: '<new prefix|reset|self [prefix|reset]>',
  category: 'setup',
  logic: 'setPrefix',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: 'usage',
  recordingFile: 'prefix/prefix.json',
};

export = command;
