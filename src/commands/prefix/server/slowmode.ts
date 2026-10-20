import type { Command } from '../../../core/types';

const command: Command = {
  name: "slowmode",
  aliases: [],
  description: "Set or disable slowmode in a text channel.",
  usage: "<seconds|off> [channel mention or ID]",
  category: "moderation",
  logic: "slowmode",
  ai: null,
  permissions: ["manage_channels"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/slowmode.json",
};

export = command;
