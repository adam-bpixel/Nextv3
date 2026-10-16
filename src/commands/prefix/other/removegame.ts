import type { Command } from '../../../core/types';

const command: Command = {
  name: "removegame",
  aliases: [],
  description: "Remove a configured game alias.",
  usage: "Usage: &clear [amount (0-99)] or &clear <user mention or ID> [amount (0-99)]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/removegame.json",
};

export = command;
