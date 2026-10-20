import type { Command } from '../../../core/types';

const command: Command = {
  name: 'clonesoundboard',
  aliases: ['clonesoundboards', 'soundboardzip', 'clonesounds'],
  description: 'Export server sounds as a ZIP.',
  usage: '[server ID]',
  category: 'Checker',
  logic: 'clonesoundboard',
  ai: null,
  permissions: ['administrator'],
  ownerOnly: false,
  cooldown: 180,
  voice: false,
  dm: true,
  kind: 'ok',
  recordingFile: 'prefix/clonesoundboard.json',
};

export = command;
