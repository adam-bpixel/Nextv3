import type { Command } from '../../../core/types';

const command: Command = {
  name: "addbot",
  aliases: [],
  description: "Dev-only: add a bot token to the extra-bot fleet.",
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
  recordingFile: "prefix/addbot.json",
};

export = command;
