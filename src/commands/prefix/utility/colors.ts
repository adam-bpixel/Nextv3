import type { Command } from '../../../core/types';

const command: Command = {
  name: 'colors',
  aliases: ['color', 'palette'],
  description: "Extract the dominant colors from a user's avatar.",
  usage: '[user]',
  category: 'utility',
  logic: 'colors',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 20,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: null,
};

export = command;
