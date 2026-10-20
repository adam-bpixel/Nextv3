import type { Command } from '../../../core/types';

const command: Command = {
  name: "perminall",
  aliases: [],
  description: "Give a role send message and connect permissions in the channel this command is run in.",
  usage: "<role ID>",
  category: "admin",
  logic: "perminall",
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
