import type { Command } from '../../../core/types';

const command: Command = {
  name: "removegame",
  aliases: [],
  description: "Remove a configured game alias.",
  usage: "<alias or role mention or ID>",
  category: "admin",
  logic: "removegame",
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
