import type { Command } from '../../../core/types';

const command: Command = {
  name: "theme",
  aliases: [],
  description: "Set a custom embed color for this server, or reset it to the bot's default.",
  usage: "<hex color|reset>",
  category: "premium",
  logic: "themePrefix",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/theme.json",
};

export = command;
