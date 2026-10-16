import type { Command } from '../../../core/types';

const command: Command = {
  name: "roles",
  aliases: [],
  description: "Show all server roles with mentions and server avatar",
  usage: "",
  category: "Information",
  logic: "roles",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/roles.json",
};

export = command;
