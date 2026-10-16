import type { Command } from '../../../core/types';

const command: Command = {
  name: "addgame",
  aliases: [],
  description: "Add or update a game alias that pings a role.",
  usage: "<role mention or ID> <alias>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/addgame.json",
};

export = command;
