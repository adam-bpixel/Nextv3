import type { Command } from '../../../core/types';

const command: Command = {
  name: "addemoji",
  aliases: [],
  description: "Add emoji to the server from custom emojis or image URLs",
  usage: "<emoji or image URL> [name]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/addemoji.json",
};

export = command;
