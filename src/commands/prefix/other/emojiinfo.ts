import type { Command } from '../../../core/types';

const command: Command = {
  name: "emojiinfo",
  aliases: [],
  description: "Show information about a custom emoji",
  usage: "",
  category: "Information",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/emojiinfo.json",
};

export = command;
