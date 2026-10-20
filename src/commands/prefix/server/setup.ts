import type { Command } from '../../../core/types';

const command: Command = {
  name: "setup",
  aliases: [],
  description: "Open the server setup panel to configure jail, verification, warn, mute, and other systems.",
  usage: "",
  category: "admin",
  logic: "setupPrefix",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/setup.json",
};

export = command;
