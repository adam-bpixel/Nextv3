import type { Command } from '../../../core/types';

const command: Command = {
  name: "cleardata",
  aliases: [],
  description: "Clear all server data (owner only).",
  usage: "",
  category: "admin",
  logic: null,
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "permission",
  recordingFile: "prefix/cleardata.json",
};

export = command;
