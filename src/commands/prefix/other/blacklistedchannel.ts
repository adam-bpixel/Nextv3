import type { Command } from '../../../core/types';

const command: Command = {
  name: "blacklistedchannel",
  aliases: [],
  description: "Manage blacklisted channels where bot commands are disabled.",
  usage: "<add|remove|list> [channel mention or ID]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/blacklistedchannel.json",
};

export = command;
