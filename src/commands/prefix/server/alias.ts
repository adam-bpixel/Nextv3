import type { Command } from '../../../core/types';

const command: Command = {
  name: "alias",
  aliases: [],
  description: "Manage no-prefix aliases for existing commands.",
  usage: "<add|remove|list> [command] [alias]",
  category: "admin",
  logic: "aliasManage",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
