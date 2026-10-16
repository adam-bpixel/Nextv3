import type { Command } from '../../../core/types';

const command: Command = {
  name: "setup",
  aliases: [],
  description: "Configure the jail, verification, and warn systems for this server.",
  usage: "<jail|verification|warn> <role...> <channel> | status",
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
