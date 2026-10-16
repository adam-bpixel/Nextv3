import type { Command } from '../../../core/types';

const command: Command = {
  name: "disabledcmd",
  aliases: [],
  description: "Manage disabled commands in your server.",
  usage: "<disable|enable|list> [command name]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/disabledcmd.json",
};

export = command;
