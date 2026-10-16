import type { Command } from '../../../core/types';

const command: Command = {
  name: "checkroles",
  aliases: ["cr"],
  description: "Scan every mutual server for a user's dangerous roles and permissions",
  usage: "<user mention, ID, or username>",
  category: "Checker",
  logic: "checkroles",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/checkroles.json",
};

export = command;
