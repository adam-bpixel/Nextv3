import type { Command } from '../../../core/types';

const command: Command = {
  name: 'clonestickers',
  aliases: ['clonesticker', 'stickerszip', 'downloadstickers', 'stickerzip'],
  description: 'Export server stickers as a ZIP.',
  usage: '[server ID]',
  category: 'Checker',
  logic: 'clonestickers',
  ai: null,
  permissions: ['administrator'],
  ownerOnly: false,
  cooldown: 180,
  voice: false,
  dm: true,
  kind: 'ok',
  recordingFile: 'prefix/clonestickers.json',
};

export = command;
