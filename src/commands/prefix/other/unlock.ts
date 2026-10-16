import type { Command } from '../../../core/types';

const command: Command = {
  name: "unlock",
  aliases: [],
  description: "Allows @everyone to send messages in specific channel.",
  usage: "",
  category: "admin",
  logic: "unlock",
  ai: null,
  permissions: ["manage_channels"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/unlock.json",
};

export = command;
