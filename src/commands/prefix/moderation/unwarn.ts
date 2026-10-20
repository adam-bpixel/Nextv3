import type { Command } from '../../../core/types';

const command: Command = {
  name: "unwarn",
  aliases: [],
  description: "Remove a warning from a user, demotes warn role as needed.",
  usage: "<user mention or ID>",
  category: "Warning",
  logic: "unwarn",
  ai: null,
  permissions: ["moderate_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
