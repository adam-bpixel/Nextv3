import type { Command } from '../../../core/types';

const command: Command = {
  name: "alias",
  aliases: [],
  description: "Manage no-prefix aliases for existing commands.",
  usage: "<add|remove|list> [command] [alias]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/alias.json",
};

export = command;
