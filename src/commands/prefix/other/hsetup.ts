import type { Command } from '../../../core/types';

const command: Command = {
  name: "hsetup",
  aliases: [],
  description: "Displays help for slash commands.",
  usage: "limits for this server.",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/hsetup.json",
};

export = command;
