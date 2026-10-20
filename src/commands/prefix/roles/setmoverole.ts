import type { Command } from '../../../core/types';

const command: Command = {
  name: "setmoverole",
  aliases: [],
  description: "Set which role can use move-related moderation commands.",
  usage: "<role>",
  category: "admin",
  logic: "setmoverole",
  ai: null,
  permissions: ["manage_roles"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
