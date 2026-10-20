import type { Command } from '../../../core/types';

const command: Command = {
  name: "deny",
  aliases: [],
  description: "Deny a role or user from the channel permissions.",
  usage: "<user or role mention/ID>",
  category: "admin",
  logic: "deny",
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
