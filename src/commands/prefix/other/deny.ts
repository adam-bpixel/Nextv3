import type { Command } from '../../../core/types';

const command: Command = {
  name: "deny",
  aliases: [],
  description: "Deny a role or user from the channel permissions.",
  usage: "<user or role mention/ID>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/deny.json",
};

export = command;
