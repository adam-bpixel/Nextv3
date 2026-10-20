import type { Command } from '../../../core/types';

const command: Command = {
  name: "addgame",
  aliases: [],
  description: "Add or update a game alias that pings a role.",
  usage: "<role mention or ID> <alias>",
  category: "admin",
  logic: "addgame",
  ai: null,
  permissions: ["manage_roles"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
