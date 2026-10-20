import type { Command } from '../../../core/types';

const command: Command = {
  name: "roleinfo",
  aliases: [],
  description: "Show detailed information about a server role",
  usage: "<role>",
  category: "Information",
  logic: "roleinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
