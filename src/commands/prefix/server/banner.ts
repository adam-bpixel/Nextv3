import type { Command } from '../../../core/types';

const command: Command = {
  name: "banner",
  aliases: ["b"],
  description: "Show a user's banner without pinging",
  usage: "",
  category: "Information",
  logic: "banner",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/banner.json",
};

export = command;
