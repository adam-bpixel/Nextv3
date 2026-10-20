import type { Command } from '../../../core/types';

const command: Command = {
  name: "emojiinfo",
  aliases: [],
  description: "Show information about a custom emoji",
  usage: "<emoji>",
  category: "Information",
  logic: "emojiinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
