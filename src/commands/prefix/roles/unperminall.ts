import type { Command } from '../../../core/types';

const command: Command = {
  name: "unperminall",
  aliases: [],
  description: "Remove send message and connect permissions from a role on all channels and categories.",
  usage: "<role ID>",
  category: "admin",
  logic: "unperminall",
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
