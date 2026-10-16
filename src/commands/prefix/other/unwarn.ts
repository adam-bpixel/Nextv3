import type { Command } from '../../../core/types';

const command: Command = {
  name: "unwarn",
  aliases: [],
  description: "Remove a warning from a user, demotes warn role as needed.",
  usage: "<user mention or ID>",
  category: "Warning",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/unwarn.json",
};

export = command;
