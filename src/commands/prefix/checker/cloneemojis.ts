import type { Command } from '../../../core/types';

const command: Command = {
  name: 'cloneemoji',
  aliases: ['cloneemojis', 'emojiszip', 'downloademojis', 'emojizip'],
  description: "Export server emojis as a ZIP.",
  usage: '[server ID]',
  category: 'Checker',
  logic: 'cloneemojis',
  ai: null,
  permissions: ['administrator'],
  ownerOnly: false,
  cooldown: 180,
  voice: false,
  dm: true,
  kind: 'ok',
  recordingFile: 'prefix/cloneemoji.json',
};

export = command;
