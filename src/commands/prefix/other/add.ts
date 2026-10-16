import type { Command } from '../../../core/types';

const command: Command = {
  name: "add",
  aliases: [],
  description: "Add a role or user to the channel permissions.",
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
  recordingFile: "prefix/add.json",
};

export = command;
