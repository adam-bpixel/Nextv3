import type { Command } from '../../../core/types';

const command: Command = {
  name: "listbots",
  aliases: [],
  description: "Dev-only: list managed extra bots and their current status.",
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
  recordingFile: "prefix/listbots.json",
};

export = command;
