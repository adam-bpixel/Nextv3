import type { Command } from '../../../core/types';

const command: Command = {
  name: "unperminall",
  aliases: [],
  description: "Remove send message and connect permissions from a role on all channels and categories.",
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
  recordingFile: "prefix/unperminall.json",
};

export = command;
