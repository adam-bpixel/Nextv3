import type { Command } from '../../../core/types';

const command: Command = {
  name: 'cloneroles',
  aliases: ['cloneroleicons', 'roleiconszip', 'downloadroleicons'],
  description: 'Export server role icons as a ZIP.',
  usage: '[server ID]',
  category: 'Checker',
  logic: 'cloneroles',
  ai: null,
  permissions: ['administrator'],
  ownerOnly: false,
  cooldown: 180,
  voice: false,
  dm: true,
  kind: 'ok',
  recordingFile: 'prefix/cloneroles.json',
};

export = command;
