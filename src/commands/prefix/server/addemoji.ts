import type { Command } from '../../../core/types';

const command: Command = {
  name: "addemoji",
  aliases: [],
  description: "Add emoji to the server from custom emojis or image URLs",
  usage: "<emoji or image URL> [name]",
  category: "admin",
  logic: "addEmoji",
  ai: null,
  permissions: ["manage_guild_expressions"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
