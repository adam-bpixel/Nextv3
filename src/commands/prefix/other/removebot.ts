import type { Command } from '../../../core/types';

const command: Command = {
  name: "removebot",
  aliases: [],
  description: "Dev-only: remove a managed extra bot and delete its saved token.",
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
  recordingFile: "prefix/removebot.json",
};

export = command;
