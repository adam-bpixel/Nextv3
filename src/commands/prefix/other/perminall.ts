import type { Command } from '../../../core/types';

const command: Command = {
  name: "perminall",
  aliases: [],
  description: "Give a role send message and connect permissions on all channels and categories.",
  usage: "<role ID>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/perminall.json",
};

export = command;
