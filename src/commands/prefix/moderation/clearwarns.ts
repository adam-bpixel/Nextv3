import type { Command } from '../../../core/types';

const command: Command = {
  name: "clearwarns",
  aliases: [],
  description: "Remove all active warnings and warn roles from a user.",
  usage: "<user mention or ID>",
  category: "Warning",
  logic: "clearwarns",
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
