import type { Command } from '../../../core/types';

const command: Command = {
  name: "usebot",
  aliases: [],
  description: "Dev-only: choose which managed bot should answer commands in this server.",
  usage: "",
  category: "devs",
  logic: null,
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "permission",
  recordingFile: "prefix/usebot.json",
};

export = command;
