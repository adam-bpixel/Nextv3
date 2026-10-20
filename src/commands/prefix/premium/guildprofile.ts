import type { Command } from '../../../core/types';

const command: Command = {
  name: "guildprofile",
  aliases: ["gp", "gb"],
  description: "Customize the bot's avatar, banner, name, bio, or name style for this server. Requires Premium.",
  usage: "<name|avatar|banner|bio|style> <value|reset>",
  category: "premium",
  logic: "guildProfile",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "premium",
  recordingFile: null,
};

export = command;
