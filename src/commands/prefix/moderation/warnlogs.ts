import type { Command } from '../../../core/types';

const command: Command = {
  name: "warnlogs",
  aliases: [],
  description: "Show all warning history for a user in this server.",
  usage: "<user mention or ID>",
  category: "Warning",
  logic: "warnlogs",
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
