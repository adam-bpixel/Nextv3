import type { Command } from '../../../core/types';

const command: Command = {
  name: "clear",
  aliases: [],
  description: "Clear a specified number of messages or messages with specific criteria.",
  usage: "",
  category: "admin",
  logic: "purge",
  ai: null,
  permissions: ["manage_messages"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "silent",
  recordingFile: "prefix/clear.json",
};

export = command;
