import type { Command } from '../../../core/types';

const command: Command = {
  name: "list",
  aliases: [],
  description: "Show List of admin, bot, users, or users by ID in server",
  usage: "",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/list.json",
};

export = command;
